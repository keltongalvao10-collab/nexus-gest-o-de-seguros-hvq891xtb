import { FileText, AlertCircle, CalendarClock, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockApolices } from '@/lib/mock-data'
import { DashboardCharts } from '@/components/DashboardCharts'

const statCards = [
  {
    title: 'Apólices Ativas',
    value: '1.284',
    icon: FileText,
    desc: '+12% no último mês',
    color: 'text-nexus-blue',
  },
  {
    title: 'Propostas Pendentes',
    value: '14',
    icon: AlertCircle,
    desc: '3 com mais de 7 dias',
    color: 'text-red-500',
    alert: true,
  },
  {
    title: 'Parcelas a Vencer (5 dias)',
    value: 'R$ 45.200',
    icon: CalendarClock,
    desc: '42 parcelas',
    color: 'text-orange-500',
  },
  {
    title: 'Comissões a Receber',
    value: 'R$ 18.500',
    icon: DollarSign,
    desc: 'Previsto para o mês',
    color: 'text-green-600',
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'Vigente':
      return (
        <Badge className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 border-transparent text-white">
          Vigente
        </Badge>
      )
    case 'Aguard. Apólice':
      return (
        <Badge className="bg-blue-400 hover:bg-blue-400/90 border-transparent text-white">
          Aguard. Apólice
        </Badge>
      )
    case 'Cancelada':
      return (
        <Badge className="bg-[#E74C3C] hover:bg-[#E74C3C]/90 border-transparent text-white">
          Cancelada
        </Badge>
      )
    case 'Renovação':
      return (
        <Badge className="bg-[#9B59B6] hover:bg-[#9B59B6]/90 border-transparent text-white">
          Renovação
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function Index() {
  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card
            key={i}
            className={`border-none shadow-elevation ${stat.alert ? 'ring-1 ring-red-200 bg-red-50/30' : ''}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p
                className={`text-xs mt-1 ${stat.alert ? 'text-red-600 font-medium' : 'text-gray-500'}`}
              >
                {stat.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardCharts />

      {/* Recent Activity Table */}
      <Card className="border-none shadow-elevation">
        <CardHeader>
          <CardTitle>Últimas Apólices Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Seguradora</TableHead>
                <TableHead>Ramo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Prêmio</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApolices.map((apolice) => (
                <TableRow
                  key={apolice.id}
                  className={apolice.status === 'Aguard. Apólice' ? 'bg-blue-50/30' : ''}
                >
                  <TableCell className="font-medium">{apolice.id}</TableCell>
                  <TableCell>{apolice.cliente}</TableCell>
                  <TableCell>{apolice.seguradora}</TableCell>
                  <TableCell>{apolice.ramo}</TableCell>
                  <TableCell>{apolice.data}</TableCell>
                  <TableCell className="text-right font-mono">
                    R$ {apolice.premio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(apolice.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
