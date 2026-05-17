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
}

export default function PainelControle() {
  const [searchTerm, setSearchTerm] = useState('')
  const [apolices, setApolices] = useState<any[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [reviewQueue, setReviewQueue] = useState<ReviewData[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const loadApolices = async () => {
    try {
      const data = await pb.collection('policies').getFullList({
        sort: '-created',
        expand: 'client,insurer',
      })
      setApolices(
        data.map((a: any) => ({
          pbId: a.id,
          id: a.policy_number,
          cliente: a.expand?.client?.name || 'Desconhecido',
          seguradora: a.expand?.insurer?.name || 'Desconhecida',
          ramo: 'Automóvel',
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

  useEffect(() => {
    loadApolices()
  }, [])

  useRealtime('policies', () => {
    loadApolices()
  })

  // Simulated AI PDF Data Extraction mapping to the requested Allianz Auto format
  const extractPdfData = async (file: File): Promise<ReviewData> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          file,
          clientName: 'ADELVANI OLIVEIRA NUNES VIANA ME',
          clientDocument: '01.584.045/0001-13',
          clientEmail: 'corretorvip2017@gmail.com',
          insurerName: 'Allianz Seguros S.A.',
          policyNumber: '137916234',
          startDate: '2026-05-09',
          endDate: '2027-05-09',
          premium: '3680.10',
          installmentsCount: '10',
          installmentValue: '368.01',
        })
      }, 1500)
    })
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
      formData.append('status', 'pending')
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

      toast({
        title: 'Importação Concluída',
        description: `Apólice ${data.policyNumber} registrada com sucesso.`,
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
        return <Badge className="bg-[#2ECC71] text-white hover:bg-[#2ECC71]">Vigente</Badge>
      case 'pending':
        return <Badge className="bg-blue-400 text-white hover:bg-blue-400">Pendente</Badge>
      case 'canceled':
        return <Badge className="bg-[#E74C3C] text-white hover:bg-[#E74C3C]">Cancelada</Badge>
      case 'expired':
        return <Badge className="bg-[#9B59B6] text-white hover:bg-[#9B59B6]">Renovação</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredApolices = apolices.filter(
    (a: any) =>
      a.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
                Extração automática de Cliente, Seguradora e Parcelas
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

              {/* Parcelas */}
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
                <p className="text-xs text-gray-500">
                  As datas de vencimento serão calculadas mensalmente a partir da data de início da
                  vigência.
                </p>
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
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
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
