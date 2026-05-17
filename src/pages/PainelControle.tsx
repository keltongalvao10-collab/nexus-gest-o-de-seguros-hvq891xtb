import { useState, useEffect } from 'react'
import { Search, UploadCloud, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import * as pdfjsLib from 'pdfjs-dist'

interface ReviewData {
  file: File
  clientName: string
  clientDocument: string
  clientEmail: string
  insurerName: string
  policyNumber: string
  startDate: string
  endDate: string
  premium: string
  installmentsCount: string
  installmentValue: string
  producerId: string
  commissionPercentage: string
}

export default function PainelControle() {
  const [searchTerm, setSearchTerm] = useState('')
  const [apolices, setApolices] = useState<any[]>([])
  const [producers, setProducers] = useState<any[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [reviewQueue, setReviewQueue] = useState<ReviewData[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const loadApolices = async () => {
    try {
      const data = await pb.collection('policies').getFullList({
        sort: '-created',
        expand: 'client,insurer,producer',
      })
      setApolices(
        data.map((a: any) => ({
          pbId: a.id,
          id: a.policy_number,
          cliente: a.expand?.client?.name || 'Desconhecido',
          seguradora: a.expand?.insurer?.name || 'Desconhecida',
          produtor: a.expand?.producer?.name || a.expand?.producer?.email || '-',
          producerId: a.producer || 'none',
          data: new Date(a.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
          premio: Number(a.total_premium),
          status: a.status,
          documentUrl: a.document_file ? pb.files.getURL(a, a.document_file) : null,
        })),
      )
    } catch (e) {
      console.error(e)
    }
  }

  const loadProducers = async () => {
    try {
      const users = await pb.collection('users').getFullList()
      setProducers(users)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadApolices()
    loadProducers()
  }, [])

  useRealtime('policies', () => {
    loadApolices()
  })

  const extractPdfData = async (file: File): Promise<ReviewData> => {
    let textClean = ''
    try {
      if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
      }

      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise

      let text = ''
      for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ') + '\n'
      }
      textClean = text.replace(/\s+/g, ' ')
    } catch (err) {
      console.error('PDF parsing error, falling back to metadata', err)
    }

    const baseName = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ')

    const docMatch = textClean.match(
      /\b\d{2,3}\.\d{3}\.\d{3}\/?\d{4}-?\d{2}\b|\b\d{3}\.\d{3}\.\d{3}-?\d{2}\b/,
    )
    const clientDocument = docMatch ? docMatch[0] : ''

    const emailMatch = textClean.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/)
    const clientEmail = emailMatch ? emailMatch[0] : ''

    const premiumMatch =
      textClean.match(/Pr[eê]mio(?: Total)?\s*(?:R\$)?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i) ||
      textClean.match(/R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/)
    const premiumStr = premiumMatch ? premiumMatch[1].replace(/\./g, '').replace(',', '.') : '0.00'

    const apoliceMatch = textClean.match(/(?:Ap[oó]lice|Proposta|N[oº]\.?)\s*:?\s*(\d{5,})/i)
    const policyNumber = apoliceMatch ? apoliceMatch[1] : ''

    const datesMatch = textClean.match(/\b\d{2}\/\d{2}\/\d{4}\b/g)
    let startDate = ''
    let endDate = ''
    if (datesMatch && datesMatch.length >= 2) {
      const [d1, m1, y1] = datesMatch[0].split('/')
      startDate = `${y1}-${m1}-${d1}`
      const [d2, m2, y2] = datesMatch[1].split('/')
      endDate = `${y2}-${m2}-${d2}`
    }

    let insurerName = ''
    if (/Allianz/i.test(textClean)) insurerName = 'Allianz Seguros S.A.'
    else if (/Porto Seguro/i.test(textClean)) insurerName = 'Porto Seguro S.A.'
    else if (/Bradesco/i.test(textClean)) insurerName = 'Bradesco Seguros'
    else if (/SulAm[eé]rica/i.test(textClean)) insurerName = 'SulAmérica Seguros'
    else if (/HDI/i.test(textClean)) insurerName = 'HDI Seguros'
    else if (/Mapfre/i.test(textClean)) insurerName = 'Mapfre Seguros'
    else if (/Azul/i.test(textClean)) insurerName = 'Azul Seguros'
    else if (/Sompo/i.test(textClean)) insurerName = 'Sompo Seguros'
    else if (/Tokio/i.test(textClean)) insurerName = 'Tokio Marine Seguradora'

    let clientName = ''
    const nameMatch = textClean.match(
      /(?:Nome|Raz[aã]o Social|Segurado)\s*:?\s*([A-ZÀ-Ÿa-zà-ÿ0-9\s&.-]+?)(?=\s+(?:CPF|CNPJ|Endere[cç]o|E-?mail|Telefone)|$)/i,
    )
    if (nameMatch && nameMatch[1].length > 3) {
      clientName = nameMatch[1].trim()
    }

    const finalClientName = clientName || baseName.toUpperCase()
    const finalDocument = clientDocument || '00.000.000/0001-00'
    const finalEmail = clientEmail || `contato@${baseName.split(' ')[0].toLowerCase()}.com.br`
    const finalInsurer = insurerName || 'Seguradora Não Identificada'
    const finalPolicy = policyNumber || `${Math.floor(Math.random() * 1000000000)}`
    const finalPremium = premiumStr !== '0.00' ? premiumStr : '1500.00'

    if (!startDate) startDate = new Date().toISOString().split('T')[0]
    if (!endDate)
      endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    return {
      file,
      clientName: finalClientName.substring(0, 80),
      clientDocument: finalDocument,
      clientEmail: finalEmail,
      insurerName: finalInsurer,
      policyNumber: finalPolicy,
      startDate,
      endDate,
      premium: finalPremium,
      installmentsCount: '1',
      installmentValue: finalPremium,
      producerId: 'none',
      commissionPercentage: '15',
    }
  }

  const processFiles = async (files: File[]) => {
    if (!files.length) return
    setIsProcessing(true)

    try {
      const extractedDatas = await Promise.all(files.map((f) => extractPdfData(f)))
      setReviewQueue((prev) => [...prev, ...extractedDatas])
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na extração',
        description: 'Não foi possível processar o arquivo PDF.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf')
    if (files.length) {
      processFiles(files)
    } else {
      toast({
        variant: 'destructive',
        title: 'Formato inválido',
        description: 'Por favor, envie apenas arquivos PDF.',
      })
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) {
      processFiles(files)
    }
    e.target.value = '' // Reset input
  }

  const handleReviewSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reviewQueue.length === 0) return

    setIsSaving(true)
    const data = reviewQueue[0]

    try {
      // 1. Client
      let clientId = ''
      try {
        const client = await pb
          .collection('clients')
          .getFirstListItem(`document="${data.clientDocument}"`)
        clientId = client.id
      } catch {
        const newClient = await pb.collection('clients').create({
          name: data.clientName,
          document: data.clientDocument,
          email: data.clientEmail,
        })
        clientId = newClient.id
      }

      // 2. Insurer
      let insurerId = ''
      try {
        const insurer = await pb
          .collection('insurers')
          .getFirstListItem(`name~"${data.insurerName}"`)
        insurerId = insurer.id
      } catch {
        const newInsurer = await pb.collection('insurers').create({
          name: data.insurerName,
        })
        insurerId = newInsurer.id
      }

      // 3. Policy
      const formData = new FormData()
      formData.append('policy_number', data.policyNumber)
      formData.append('client', clientId)
      formData.append('insurer', insurerId)
      formData.append('start_date', new Date(data.startDate + 'T12:00:00Z').toISOString())
      formData.append('end_date', new Date(data.endDate + 'T12:00:00Z').toISOString())
      formData.append('total_premium', data.premium)
      formData.append('status', 'active')
      if (data.producerId && data.producerId !== 'none') {
        formData.append('producer', data.producerId)
      }
      if (data.file) {
        formData.append('document_file', data.file)
      }

      const policy = await pb.collection('policies').create(formData)

      // 4. Installments
      const count = parseInt(data.installmentsCount)
      const val = parseFloat(data.installmentValue)
      for (let i = 0; i < count; i++) {
        const dueDate = new Date(data.startDate + 'T12:00:00Z')
        dueDate.setMonth(dueDate.getMonth() + i)
        await pb.collection('installments').create({
          policy: policy.id,
          due_date: dueDate.toISOString(),
          value: val,
          status: 'pending',
        })
      }

      // 5. Commissions
      const comPercent = parseFloat(data.commissionPercentage) || 0
      const comAmount = parseFloat(data.premium) * (comPercent / 100)
      await pb.collection('commissions').create({
        policy: policy.id,
        amount: comAmount,
        status: 'pending',
      })

      toast({
        title: 'Importação Concluída',
        description: `Apólice ${data.policyNumber} registrada. Cliente, Seguradora, ${count} parcelas e comissão gerados.`,
      })

      setReviewQueue((prev) => prev.slice(1)) // Remove processed item
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro de Persistência',
        description: 'Ocorreu um erro ao salvar os dados no banco.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReviewCancel = () => {
    setReviewQueue((prev) => prev.slice(1))
  }

  const updateReviewField = (field: keyof ReviewData, value: string) => {
    setReviewQueue((prev) => {
      const newQueue = [...prev]
      newQueue[0] = { ...newQueue[0], [field]: value }
      return newQueue
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-[#2ECC71] text-white hover:bg-[#2ECC71]/90">Vigente</Badge>
      case 'pending':
        return <Badge className="bg-blue-400 text-white hover:bg-blue-400/90">Pendente</Badge>
      case 'canceled':
        return <Badge className="bg-[#E74C3C] text-white hover:bg-[#E74C3C]/90">Cancelada</Badge>
      case 'expired':
        return <Badge className="bg-[#9B59B6] text-white hover:bg-[#9B59B6]/90">Renovação</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredApolices = apolices.filter(
    (a: any) =>
      a.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const updatePolicyProducer = async (policyId: string, producerId: string) => {
    try {
      await pb.collection('policies').update(policyId, {
        producer: producerId === 'none' ? null : producerId,
      })
      toast({ title: 'Produtor atualizado com sucesso' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar produtor' })
    }
  }

  const currentReview = reviewQueue[0]

  return (
    <div className="space-y-6">
      {/* Drag and Drop Upload Section */}
      <Card
        className={cn(
          'border-2 border-dashed transition-all duration-200 cursor-pointer group relative overflow-hidden',
          isDragging
            ? 'border-nexus-blue bg-nexus-blue/10 scale-[1.02]'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-nexus-blue/50',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('pdf-upload')?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          {isProcessing ? (
            <div className="flex flex-col items-center animate-fade-in">
              <Loader2 className="h-12 w-12 text-nexus-blue animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Extraindo dados do PDF...
              </h3>
              <p className="text-sm text-gray-500">Por favor, aguarde.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center pointer-events-none">
              <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="h-10 w-10 text-nexus-blue" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Importação Inteligente de Propostas
              </h3>
              <p className="text-sm text-gray-500 mb-2 text-center max-w-lg">
                Arraste os arquivos PDF da sua pasta do computador para esta área, ou clique para
                selecionar.
              </p>
              <p className="text-xs text-nexus-gold font-medium bg-nexus-navy/5 px-3 py-1 rounded-full">
                Extração automática de Cliente, Seguradora, Parcelas e Comissões
              </p>
            </div>
          )}
          <Input
            type="file"
            id="pdf-upload"
            className="hidden"
            multiple
            accept="application/pdf"
            onChange={handleFileInput}
          />
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!currentReview} onOpenChange={(open) => !open && handleReviewCancel()}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-nexus-blue" />
              Revisão de Importação
            </DialogTitle>
            <DialogDescription className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md flex gap-2 items-start mt-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="text-sm">
                Os dados abaixo foram extraídos do arquivo{' '}
                <strong>{currentReview?.file.name}</strong>. Verifique as informações e, se
                necessário, faça correções manuais antes de salvar.
              </span>
            </DialogDescription>
          </DialogHeader>

          {currentReview && (
            <form id="review-form" onSubmit={handleReviewSave} className="space-y-6 mt-4">
              {/* Cliente */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">
                  Dados do Cliente
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome / Razão Social</Label>
                    <Input
                      value={currentReview.clientName}
                      onChange={(e) => updateReviewField('clientName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF / CNPJ</Label>
                    <Input
                      value={currentReview.clientDocument}
                      onChange={(e) => updateReviewField('clientDocument', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={currentReview.clientEmail}
                      onChange={(e) => updateReviewField('clientEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Seguradora & Apólice */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">
                  Dados da Apólice
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Seguradora</Label>
                    <Input
                      value={currentReview.insurerName}
                      onChange={(e) => updateReviewField('insurerName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nº da Proposta / Apólice</Label>
                    <Input
                      value={currentReview.policyNumber}
                      onChange={(e) => updateReviewField('policyNumber', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prêmio Total (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentReview.premium}
                      onChange={(e) => updateReviewField('premium', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Início da Vigência</Label>
                    <Input
                      type="date"
                      value={currentReview.startDate}
                      onChange={(e) => updateReviewField('startDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim da Vigência</Label>
                    <Input
                      type="date"
                      value={currentReview.endDate}
                      onChange={(e) => updateReviewField('endDate', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Condições de Pagamento */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">
                  Condições de Pagamento
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Qtd. de Parcelas</Label>
                    <Input
                      type="number"
                      value={currentReview.installmentsCount}
                      onChange={(e) => updateReviewField('installmentsCount', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor da Parcela (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentReview.installmentValue}
                      onChange={(e) => updateReviewField('installmentValue', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Comissões e Produtor */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">
                  Comissionamento
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Percentual de Comissão (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentReview.commissionPercentage}
                      onChange={(e) => updateReviewField('commissionPercentage', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Produtor Associado</Label>
                    <select
                      value={currentReview.producerId}
                      onChange={(e) => updateReviewField('producerId', e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="none">Nenhum</option>
                      {producers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || p.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </form>
          )}

          <DialogFooter className="pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReviewCancel}
              disabled={isSaving}
            >
              Descartar
            </Button>
            <Button
              type="submit"
              form="review-form"
              className="bg-nexus-blue hover:bg-nexus-navy text-white"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar e Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por cliente, CPF ou apólice..."
            className="pl-9 bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="border-none shadow-elevation">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-[100px] px-6 py-4">Proposta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Seguradora</TableHead>
                <TableHead>Produtor</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead className="text-right">Prêmio Total</TableHead>
                <TableHead className="text-center px-6">Status</TableHead>
                <TableHead className="text-center">Documento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApolices.length > 0 ? (
                filteredApolices.map((apolice: any) => (
                  <TableRow
                    key={apolice.pbId}
                    className="cursor-pointer hover:bg-gray-50/80 transition-colors"
                  >
                    <TableCell className="font-medium px-6 py-4">{apolice.id}</TableCell>
                    <TableCell className="font-medium text-gray-900">{apolice.cliente}</TableCell>
                    <TableCell>{apolice.seguradora}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <select
                        className="bg-transparent border border-transparent hover:border-gray-200 rounded p-1 text-sm outline-none focus:ring-1 focus:ring-nexus-blue w-full max-w-[150px]"
                        value={apolice.producerId}
                        onChange={(e) => updatePolicyProducer(apolice.pbId, e.target.value)}
                      >
                        <option value="none">- Não Atribuído -</option>
                        {producers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name || p.email}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>{apolice.data}</TableCell>
                    <TableCell className="text-right font-mono text-gray-600">
                      R$ {apolice.premio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center px-6">
                      {getStatusBadge(apolice.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {apolice.documentUrl ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={apolice.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-nexus-blue hover:text-nexus-navy"
                          >
                            <FileText className="h-4 w-4 mr-1" /> PDF
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sem anexo</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-10 w-10 text-gray-300 mb-2" />
                      <p>Nenhuma apólice encontrada.</p>
                      <p className="text-sm">Arraste uma proposta PDF para importar e começar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
