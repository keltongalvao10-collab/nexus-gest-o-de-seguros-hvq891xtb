import { useState } from 'react'
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
import { mockApolices } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'

export default function Apolices() {
  const [searchTerm, setSearchTerm] = useState('')

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
            Upload PDF (IA)
          </Button>
          <Button className="w-full sm:w-auto bg-nexus-blue hover:bg-nexus-navy text-nexus-gold">
            <Plus className="mr-2 h-4 w-4" />
            Nova Apólice
          </Button>
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
              {mockApolices.map((apolice) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
