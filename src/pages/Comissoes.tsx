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

export default function Comissoes() {
  const [comissoes, setComissoes] = useState<any[]>([])

  const loadComissoes = async () => {
    try {
      const data = await pb.collection('commissions').getFullList({
        sort: '-created',
        expand: 'policy,policy.client,policy.producer',
      })
      setComissoes(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadComissoes()
  }, [])
  useRealtime('commissions', loadComissoes)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge className="bg-[#2ECC71] text-white hover:bg-[#2ECC71]/90">Recebida</Badge>
      case 'pending':
        return <Badge className="bg-blue-400 text-white hover:bg-blue-400/90">Pendente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Relatório de Comissões</h2>
        <p className="text-gray-500 mt-1">Acompanhamento de repasses e comissões geradas.</p>
      </div>
      <Card className="border-none shadow-elevation">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="px-6 py-4">Apólice</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produtor</TableHead>
                <TableHead className="text-right">Valor da Comissão</TableHead>
                <TableHead className="text-center px-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comissoes.length > 0 ? (
                comissoes.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <TableCell className="px-6 py-4 font-medium">
                      {c.expand?.policy?.policy_number}
                    </TableCell>
                    <TableCell>{c.expand?.policy?.expand?.client?.name}</TableCell>
                    <TableCell>
                      {c.expand?.policy?.expand?.producer?.name ||
                        c.expand?.policy?.expand?.producer?.email ||
                        '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-nexus-blue font-semibold">
                      R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center px-6">{getStatusBadge(c.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    Nenhuma comissão cadastrada.
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
