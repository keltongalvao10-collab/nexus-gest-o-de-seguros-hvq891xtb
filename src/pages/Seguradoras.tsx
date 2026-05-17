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
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function Seguradoras() {
  const [seguradoras, setSeguradoras] = useState<any[]>([])

  const loadSeguradoras = async () => {
    try {
      const data = await pb.collection('insurers').getFullList({ sort: '-created' })
      setSeguradoras(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadSeguradoras()
  }, [])
  useRealtime('insurers', loadSeguradoras)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Seguradoras</h2>
        <p className="text-gray-500 mt-1">Lista de seguradoras parceiras.</p>
      </div>
      <Card className="border-none shadow-elevation">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="px-6 py-4">Nome</TableHead>
                <TableHead className="text-right px-6">Data de Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seguradoras.length > 0 ? (
                seguradoras.map((s) => (
                  <TableRow key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <TableCell className="px-6 py-4 font-medium">{s.name}</TableCell>
                    <TableCell className="text-right px-6">
                      {new Date(s.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-12 text-gray-500">
                    Nenhuma seguradora cadastrada.
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
