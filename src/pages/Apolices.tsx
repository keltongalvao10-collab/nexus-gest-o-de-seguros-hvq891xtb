import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Upload, FileText, Loader2 } from 'lucide-react'
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

export default function Apolices() {
  const [searchTerm, setSearchTerm] = useState('')
  const [apolices, setApolices] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const { toast } = useToast()

  // Form states
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

  // Upload states
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingPolicyId, setUploadingPolicyId] = useState<string | null>(null)
  const rowFileInputRef = useRef<HTMLInputElement>(null)

  const [globalFile, setGlobalFile] = useState<File | null>(null)
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false)
  const [selectedGlobalPolicy, setSelectedGlobalPolicy] = useState<string>('')
  const globalFileInputRef = useRef<HTMLInputElement>(null)

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
          ramo: 'Auto',
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

  // --- Row Level Upload ---
  const handleRowFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingPolicyId) return

    setIsUploading(true)
    const data = new FormData()
    data.append('document_file', file)

    try {
      await pb.collection('policies').update(uploadingPolicyId, data)
      toast({ title: 'Sucesso', description: 'Documento anexado com sucesso.' })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao anexar documento.' })
    } finally {
      setIsUploading(false)
      setUploadingPolicyId(null)
      if (rowFileInputRef.current) rowFileInputRef.current.value = ''
    }
  }

  // --- Global Button Upload ---
  const handleGlobalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setGlobalFile(file)
      setIsGlobalModalOpen(true)
    }
    if (globalFileInputRef.current) globalFileInputRef.current.value = ''
  }

  const handleGlobalSubmit = async () => {
    if (!globalFile || !selectedGlobalPolicy) return
    setIsUploading(true)
    const data = new FormData()
    data.append('document_file', globalFile)
    try {
      await pb.collection('policies').update(selectedGlobalPolicy, data)
      toast({ title: 'Sucesso', description: 'Documento anexado com sucesso.' })
      setIsGlobalModalOpen(false)
      setGlobalFile(null)
      setSelectedGlobalPolicy('')
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao anexar documento.' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFieldErrors({})
    try {
      // 1. Resolve Cliente
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

      // 2. Resolve Seguradora
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

      // 3. Insert Apolice
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por cliente, CPF ou apólice..."
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Hidden inputs for file upload */}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={globalFileInputRef}
            onChange={handleGlobalFileChange}
          />
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={rowFileInputRef}
            onChange={handleRowFileChange}
          />

          <Button
            variant="outline"
            className="w-full sm:w-auto bg-white hover:text-nexus-blue"
            onClick={() => globalFileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload PDF
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-nexus-blue hover:bg-nexus-navy text-nexus-gold">
                <Plus className="mr-2 h-4 w-4" />
                Nova Apólice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Apólice</DialogTitle>
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

          {/* Modal for Global Upload File Attach */}
          <Dialog open={isGlobalModalOpen} onOpenChange={setIsGlobalModalOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Anexar Documento</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Arquivo selecionado:{' '}
                  <span className="font-medium text-gray-900">{globalFile?.name}</span>
                </p>
                <div className="space-y-2">
                  <Label>Vincular à Apólice</Label>
                  <Select value={selectedGlobalPolicy} onValueChange={setSelectedGlobalPolicy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma apólice..." />
                    </SelectTrigger>
                    <SelectContent>
                      {apolices.map((a: any) => (
                        <SelectItem key={a.pbId} value={a.pbId}>
                          {a.id} - {a.cliente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsGlobalModalOpen(false)
                    setGlobalFile(null)
                    setSelectedGlobalPolicy('')
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGlobalSubmit}
                  disabled={isUploading || !selectedGlobalPolicy}
                  className="bg-nexus-blue hover:bg-nexus-navy text-white"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Anexar PDF
                </Button>
              </DialogFooter>
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
                            <FileText className="h-4 w-4 mr-1" /> Ver PDF
                          </a>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadingPolicyId(apolice.pbId)
                            rowFileInputRef.current?.click()
                          }}
                          disabled={isUploading && uploadingPolicyId === apolice.pbId}
                          className="text-gray-500 hover:text-nexus-blue"
                        >
                          {isUploading && uploadingPolicyId === apolice.pbId ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-1" />
                          )}
                          Upload
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Nenhuma apólice encontrada.
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
