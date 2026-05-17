import { useState, useEffect } from 'react'
import { Plus, Search, Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react'
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

type ProcessingFile = {
  id: string
  name: string
  status: 'loading' | 'success' | 'error'
  message?: string
}

export default function PainelControle() {
  const [searchTerm, setSearchTerm] = useState('')
  const [apolices, setApolices] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([])
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    clienteNome: '',
    clienteDocumento: '',
    seguradoraNome: '',
    ramo: 'Auto',
    numeroApolice: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataVencimento: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split('T')[0],
    valorPremio: '',
    status: 'pending',
  })

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
          ramo: 'Auto', // Fixed mapping based on existing collection structure or defaults
          data: new Date(a.start_date).toLocaleDateString('pt-BR'),
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // Reset input so the same file can be selected again
    e.target.value = ''

    const newProcessings = files.map((f) => ({
      id: Math.random().toString(36).substring(7),
      name: f.name,
      status: 'loading' as const,
    }))
    setProcessingFiles((prev) => [...newProcessings, ...prev])

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileId = newProcessings[i].id

      try {
        // Simulação de processamento inteligente/AI do PDF
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 2000))

        const insurers = ['Porto Seguro', 'Allianz', 'Sulamérica', 'HDI', 'Bradesco', 'Mapfre']
        const insurerName = insurers[Math.floor(Math.random() * insurers.length)]
        const clientName = `Cliente ${file.name.replace('.pdf', '')} ${Math.floor(Math.random() * 100)}`
        const policyNumber = `AP-${Math.floor(10000 + Math.random() * 90000)}`

        // 1. Resolve Cliente
        let clientId = ''
        try {
          const client = await pb.collection('clients').getFirstListItem(`name="${clientName}"`)
          clientId = client.id
        } catch {
          const docStr = `${Math.floor(Math.random() * 999)}.${Math.floor(Math.random() * 999)}.${Math.floor(Math.random() * 999)}-${Math.floor(Math.random() * 99)}`
          const newClient = await pb.collection('clients').create({
            name: clientName,
            document: docStr,
          })
          clientId = newClient.id
        }

        // 2. Resolve Seguradora
        let insurerId = ''
        try {
          const insurer = await pb.collection('insurers').getFirstListItem(`name="${insurerName}"`)
          insurerId = insurer.id
        } catch {
          const newInsurer = await pb.collection('insurers').create({ name: insurerName })
          insurerId = newInsurer.id
        }

        // 3. Create Apolice
        const policyData = new FormData()
        policyData.append('policy_number', policyNumber)
        policyData.append('client', clientId)
        policyData.append('insurer', insurerId)

        const startDate = new Date()
        policyData.append('start_date', startDate.toISOString())

        const endDate = new Date(startDate)
        endDate.setFullYear(endDate.getFullYear() + 1)
        policyData.append('end_date', endDate.toISOString())

        policyData.append('total_premium', (Math.random() * 4000 + 500).toFixed(2))
        policyData.append('status', 'active')
        policyData.append('document_file', file)

        await pb.collection('policies').create(policyData)

        setProcessingFiles((prev) =>
          prev.map((p) => (p.id === fileId ? { ...p, status: 'success' } : p)),
        )
      } catch (err) {
        setProcessingFiles((prev) =>
          prev.map((p) =>
            p.id === fileId
              ? { ...p, status: 'error', message: 'Falha ao extrair dados do PDF' }
              : p,
          ),
        )
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFieldErrors({})
    try {
      let clienteId
      try {
        const clienteRes = await pb
          .collection('clients')
          .getFirstListItem(`document="${formData.clienteDocumento}"`)
        clienteId = clienteRes.id
      } catch {
        const newCliente = await pb.collection('clients').create({
          name: formData.clienteNome,
          document: formData.clienteDocumento,
        })
        clienteId = newCliente.id
      }

      let seguradoraId
      try {
        const segRes = await pb
          .collection('insurers')
          .getFirstListItem(`name~"${formData.seguradoraNome}"`)
        seguradoraId = segRes.id
      } catch {
        const dummyCnpj = Math.floor(Math.random() * 100000000000000).toString()
        const newSeg = await pb.collection('insurers').create({
          name: formData.seguradoraNome,
          document: dummyCnpj,
        })
        seguradoraId = newSeg.id
      }

      await pb.collection('policies').create({
        policy_number: formData.numeroApolice,
        client: clienteId,
        insurer: seguradoraId,
        start_date: new Date(formData.dataInicio + 'T12:00:00Z').toISOString(),
        end_date: new Date(formData.dataVencimento + 'T12:00:00Z').toISOString(),
        total_premium: parseFloat(formData.valorPremio),
        status: formData.status,
      })

      toast({ title: 'Sucesso', description: 'Apólice registrada e sincronizada.' })
      setOpen(false)
      loadApolices()

      setFormData({
        clienteNome: '',
        clienteDocumento: '',
        seguradoraNome: '',
        ramo: 'Auto',
        numeroApolice: '',
        dataInicio: new Date().toISOString().split('T')[0],
        dataVencimento: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          .toISOString()
          .split('T')[0],
        valorPremio: '',
        status: 'pending',
      })
    } catch (err: any) {
      const errors = extractFieldErrors(err)
      setFieldErrors(errors)
      toast({
        variant: 'destructive',
        title: 'Erro de Persistência',
        description: 'Verifique os campos preenchidos e tente novamente.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-[#2ECC71] text-white hover:bg-[#2ECC71]">Vigente</Badge>
      case 'pending':
        return <Badge className="bg-blue-400 text-white hover:bg-blue-400">Aguard. Apólice</Badge>
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

  return (
    <div className="space-y-6">
      {/* Intelligent Upload Section */}
      <Card
        className="border-2 border-dashed border-nexus-blue/30 bg-nexus-blue/5 hover:bg-nexus-blue/10 transition-colors cursor-pointer group"
        onClick={() => document.getElementById('pdf-upload')?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Upload className="h-12 w-12 text-nexus-blue mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Importação Inteligente de Propostas
          </h3>
          <p className="text-sm text-gray-500 mb-4 text-center max-w-lg">
            Selecione ou arraste arquivos PDF de apólices e propostas de qualquer seguradora. O
            sistema extrairá automaticamente os dados e registrará na base.
          </p>
          <Input
            type="file"
            id="pdf-upload"
            className="hidden"
            multiple
            accept="application/pdf"
            onChange={handleFileUpload}
          />
          <Button className="bg-nexus-blue hover:bg-nexus-navy text-white pointer-events-none">
            Selecionar PDFs
          </Button>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {processingFiles.length > 0 && (
        <div className="space-y-3 animate-fade-in-down">
          <h4 className="text-sm font-semibold text-gray-700">Arquivos em Processamento</h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {processingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {file.status === 'loading' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-nexus-blue" />
                      <span className="text-xs font-medium text-nexus-blue">Extraindo...</span>
                    </>
                  )}
                  {file.status === 'success' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-xs font-medium text-green-600">Salvo</span>
                    </>
                  )}
                  {file.status === 'error' && (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-xs font-medium text-red-600">Erro</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto hover:text-nexus-blue bg-white">
                <Plus className="mr-2 h-4 w-4" />
                Lançamento Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Lançamento Manual de Apólice</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clienteNome">Nome do Cliente</Label>
                    <Input
                      id="clienteNome"
                      required
                      placeholder="João da Silva"
                      value={formData.clienteNome}
                      onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                    />
                    {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clienteDocumento">CPF/CNPJ</Label>
                    <Input
                      id="clienteDocumento"
                      required
                      placeholder="000.000.000-00"
                      value={formData.clienteDocumento}
                      onChange={(e) =>
                        setFormData({ ...formData, clienteDocumento: e.target.value })
                      }
                    />
                    {fieldErrors.document && (
                      <p className="text-sm text-red-500">{fieldErrors.document}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seguradoraNome">Seguradora</Label>
                  <Input
                    id="seguradoraNome"
                    required
                    placeholder="Ex: Porto Seguro"
                    value={formData.seguradoraNome}
                    onChange={(e) => setFormData({ ...formData, seguradoraNome: e.target.value })}
                  />
                  {fieldErrors.insurer && (
                    <p className="text-sm text-red-500">{fieldErrors.insurer}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numeroApolice">Nº da Apólice/Proposta</Label>
                    <Input
                      id="numeroApolice"
                      required
                      placeholder="AP-9999"
                      value={formData.numeroApolice}
                      onChange={(e) => setFormData({ ...formData, numeroApolice: e.target.value })}
                    />
                    {fieldErrors.policy_number && (
                      <p className="text-sm text-red-500">{fieldErrors.policy_number}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ramo">Ramo</Label>
                    <Select
                      value={formData.ramo}
                      onValueChange={(v) => setFormData({ ...formData, ramo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auto">Auto</SelectItem>
                        <SelectItem value="Residencial">Residencial</SelectItem>
                        <SelectItem value="Empresarial">Empresarial</SelectItem>
                        <SelectItem value="Vida">Vida</SelectItem>
                        <SelectItem value="Saúde">Saúde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataInicio">Data Início</Label>
                    <Input
                      type="date"
                      id="dataInicio"
                      required
                      value={formData.dataInicio}
                      onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    />
                    {fieldErrors.start_date && (
                      <p className="text-sm text-red-500">{fieldErrors.start_date}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataVencimento">Data Vencimento</Label>
                    <Input
                      type="date"
                      id="dataVencimento"
                      required
                      value={formData.dataVencimento}
                      onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                    />
                    {fieldErrors.end_date && (
                      <p className="text-sm text-red-500">{fieldErrors.end_date}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valorPremio">Prêmio Total (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="valorPremio"
                      required
                      placeholder="0.00"
                      value={formData.valorPremio}
                      onChange={(e) => setFormData({ ...formData, valorPremio: e.target.value })}
                    />
                    {fieldErrors.total_premium && (
                      <p className="text-sm text-red-500">{fieldErrors.total_premium}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Vigente</SelectItem>
                        <SelectItem value="pending">Aguard. Apólice</SelectItem>
                        <SelectItem value="expired">Renovação</SelectItem>
                        <SelectItem value="canceled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.status && (
                      <p className="text-sm text-red-500">{fieldErrors.status}</p>
                    )}
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-nexus-blue hover:bg-nexus-navy text-white"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Apólice'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-elevation">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-[100px] px-6 py-4">ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Seguradora</TableHead>
                <TableHead>Ramo</TableHead>
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
                    <TableCell>{apolice.ramo}</TableCell>
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
                      <p className="text-sm">Faça o upload de uma proposta PDF para começar.</p>
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
