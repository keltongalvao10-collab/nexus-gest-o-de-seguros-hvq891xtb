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

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])

  const loadClientes = async () => {
    try {
      const data = await pb.collection('clients').getFullList({ sort: '-created' })
      setClientes(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadClientes()
  }, [])
  useRealtime('clients', loadClientes)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Clientes</h2>
        <p className="text-gray-500 mt-1">Lista de todos os clientes cadastrados no sistema.</p>
      </div>
      <Card className="border-none shadow-elevation">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="px-6 py-4">Nome / Razão Social</TableHead>
                <TableHead>Documento (CPF/CNPJ)</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-right px-6">Data de Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length > 0 ? (
                clientes.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <TableCell className="px-6 py-4 font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-sm">{c.document}</TableCell>
                    <TableCell>{c.email || '-'}</TableCell>
                    <TableCell className="text-right px-6">
                      {new Date(c.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                    Nenhum cliente cadastrado.
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
