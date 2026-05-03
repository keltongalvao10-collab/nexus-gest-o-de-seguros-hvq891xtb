import { useState, useEffect } from 'react'
import { Plus, Search, Upload } from 'lucide-react'
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
import { mockApolices } from '@/lib/mock-data'
import { fetchTable, insertRow } from '@/lib/supabase'

export default function Apolices() {
  const [searchTerm, setSearchTerm] = useState('')
  const [apolices, setApolices] = useState(mockApolices)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
    status: 'Aguard. Apólice',
  })

  const loadApolices = async () => {
    const data = await fetchTable(
      'apolices',
      'select=*,clientes(nome),seguradoras(razao_social)&order=data_inicio.desc',
    )
    if (data && data.length > 0) {
      setApolices(
        data.map((a: any) => ({
          id: a.numero_apolice,
          cliente: a.clientes?.nome || 'Desconhecido',
          seguradora: a.seguradoras?.razao_social || 'Desconhecida',
          ramo: a.ramo,
          data: new Date(a.data_inicio).toLocaleDateString('pt-BR'),
          premio: Number(a.valor_premio),
          status: a.status,
        })),
      )
    }
  }

  useEffect(() => {
    loadApolices()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // 1. Resolve Cliente
      let clienteRes = await fetchTable(`clientes?documento=eq.${formData.clienteDocumento}`)
      let clienteId
      if (clienteRes && clienteRes.length > 0) {
        clienteId = clienteRes[0].id
      } else {
        const newCliente = await insertRow('clientes', {
          nome: formData.clienteNome,
          documento: formData.clienteDocumento,
        })
        clienteId = newCliente[0]?.id || newCliente.id
      }

      // 2. Resolve Seguradora
      let segRes = await fetchTable(
        `seguradoras?razao_social=eq.${encodeURIComponent(formData.seguradoraNome)}`,
      )
      let seguradoraId
      if (segRes && segRes.length > 0) {
        seguradoraId = segRes[0].id
      } else {
        const dummyCnpj = Math.floor(Math.random() * 100000000000000).toString()
        const newSeg = await insertRow('seguradoras', {
          razao_social: formData.seguradoraNome,
          cnpj: dummyCnpj,
        })
        seguradoraId = newSeg[0]?.id || newSeg.id
      }

      // 3. Insert Apolice
      await insertRow('apolices', {
        numero_apolice: formData.numeroApolice,
        cliente_id: clienteId,
        seguradora_id: seguradoraId,
        ramo: formData.ramo,
        data_inicio: formData.dataInicio,
        data_vencimento: formData.dataVencimento,
        valor_premio: parseFloat(formData.valorPremio),
        status: formData.status,
      })

      toast({ title: 'Sucesso', description: 'Apólice registrada e sincronizada com o Supabase.' })
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
        status: 'Aguard. Apólice',
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro de Persistência',
        description: err.message || 'Verifique se as tabelas foram criadas no Supabase.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Vigente':
        return <Badge className="bg-[#2ECC71] text-white hover:bg-[#2ECC71]">Vigente</Badge>
      case 'Aguard. Apólice':
        return <Badge className="bg-blue-400 text-white hover:bg-blue-400">Aguard. Apólice</Badge>
      case 'Cancelada':
        return <Badge className="bg-[#E74C3C] text-white hover:bg-[#E74C3C]">Cancelada</Badge>
      case 'Renovação':
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
          <Button variant="outline" className="w-full sm:w-auto bg-white hover:text-nexus-blue">
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
                        <SelectItem value="Vigente">Vigente</SelectItem>
                        <SelectItem value="Aguard. Apólice">Aguard. Apólice</SelectItem>
                        <SelectItem value="Renovação">Renovação</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApolices.length > 0 ? (
                filteredApolices.map((apolice: any) => (
                  <TableRow
                    key={apolice.id}
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
