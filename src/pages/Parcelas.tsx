import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function Parcelas() {
  const [parcelas, setParcelas] = useState<any[]>([])

  const loadParcelas = async () => {
    try {
      const data = await pb.collection('installments').getFullList({
        sort: 'due_date',
        expand: 'policy,policy.client',
      })
      setParcelas(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadParcelas()
  }, [])
  useRealtime('installments', loadParcelas)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-[#2ECC71] text-white hover:bg-[#2ECC71]/90">Paga</Badge>
      case 'pending':
        return <Badge className="bg-blue-400 text-white hover:bg-blue-400/90">Pendente</Badge>
      case 'overdue':
        return <Badge className="bg-[#E74C3C] text-white hover:bg-[#E74C3C]/90">Atrasada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Cronograma de Parcelas</h2>
        <p className="text-gray-500 mt-1">
          Acompanhamento de vencimentos e recebimentos dos clientes.
        </p>
      </div>
      <Card className="border-none shadow-elevation">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="px-6 py-4">Apólice</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center px-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcelas.length > 0 ? (
                parcelas.map((p) => (
                  <TableRow key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <TableCell className="px-6 py-4 font-medium">
                      {p.expand?.policy?.policy_number}
                    </TableCell>
                    <TableCell>{p.expand?.policy?.expand?.client?.name}</TableCell>
                    <TableCell>
                      {new Date(p.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center px-6">{getStatusBadge(p.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    Nenhuma parcela cadastrada.
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
