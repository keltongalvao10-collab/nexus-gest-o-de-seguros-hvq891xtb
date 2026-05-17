import { useEffect, useState } from 'react'
import { FileText, AlertCircle, CalendarClock, DollarSign, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DashboardCharts } from '@/components/DashboardCharts'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

const initialStatCards = [
  {
    title: 'Apólices Ativas',
    value: '0',
    icon: FileText,
    desc: 'Carregando...',
    color: 'text-nexus-blue',
  },
  {
    title: 'Propostas Pendentes',
    value: '0',
    icon: AlertCircle,
    desc: 'Carregando...',
    color: 'text-red-500',
    alert: true,
  },
  {
    title: 'Parcelas a Vencer',
    value: '0',
    icon: CalendarClock,
    desc: 'Carregando...',
    color: 'text-orange-500',
  },
  {
    title: 'Comissões a Receber',
    value: '0',
    icon: DollarSign,
    desc: 'Carregando...',
    color: 'text-green-600',
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-[#2ECC71] hover:bg-[#2ECC71]/90 border-transparent text-white">
          Vigente
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-blue-400 hover:bg-blue-400/90 border-transparent text-white">
          Aguard. Apólice
        </Badge>
      )
    case 'canceled':
      return (
        <Badge className="bg-[#E74C3C] hover:bg-[#E74C3C]/90 border-transparent text-white">
          Cancelada
        </Badge>
      )
    case 'expired':
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
  const [stats, setStats] = useState(initialStatCards)
  const [recentApolices, setRecentApolices] = useState<any[]>([])
  const [dbStatus, setDbStatus] = useState<'loading' | 'connected' | 'error'>('loading')

  const loadDashboard = async () => {
    try {
      const apolicesData = await pb.collection('policies').getList(1, 5, {
        sort: '-created',
        expand: 'client,insurer',
      })

      const mapped = apolicesData.items.map((a: any) => ({
        id: a.policy_number,
        cliente: a.expand?.client?.name || 'Desconhecido',
        seguradora: a.expand?.insurer?.name || 'Desconhecida',
        ramo: 'Auto',
        data: new Date(a.start_date).toLocaleDateString('pt-BR'),
        premio: Number(a.total_premium),
        status: a.status,
      }))
      setRecentApolices(mapped)

      const [ativas, pendentes, parcelas, comissoes] = await Promise.all([
        pb.collection('policies').getList(1, 1, { filter: 'status="active"' }),
        pb.collection('policies').getList(1, 1, { filter: 'status="pending"' }),
        pb.collection('installments').getList(1, 1, { filter: 'status="pending"' }),
        pb.collection('commissions').getList(1, 1, { filter: 'status="pending"' }),
      ])

      setStats([
        { ...initialStatCards[0], value: String(ativas.totalItems), desc: 'Dados reais do banco' },
        {
          ...initialStatCards[1],
          value: String(pendentes.totalItems),
          desc: 'Dados reais do banco',
        },
        {
          ...initialStatCards[2],
          value: String(parcelas.totalItems),
          desc: 'Dados reais do banco',
        },
        {
          ...initialStatCards[3],
          value: String(comissoes.totalItems),
          desc: 'Dados reais do banco',
        },
      ])
      setDbStatus('connected')
    } catch (e) {
      console.error('Failed to load dashboard', e)
      setDbStatus('error')
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useRealtime('policies', () => {
    loadDashboard()
  })

  useRealtime('installments', () => {
    loadDashboard()
  })

  useRealtime('commissions', () => {
    loadDashboard()
  })

  return (
    <div className="space-y-8">
      {dbStatus === 'connected' && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-md text-sm font-medium flex items-center border border-green-200">
          <Database className="w-4 h-4 mr-2" />
          Conectado ao banco de dados PocketBase com sucesso. Os dados estão sendo sincronizados.
        </div>
      )}
      {dbStatus === 'error' && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm font-medium flex items-center border border-red-200">
          <AlertCircle className="w-4 h-4 mr-2" />
          Erro ao conectar ao banco de dados PocketBase.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
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
          <CardDescription>Resumo em tempo real das operações recentes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-[100px]">ID / Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Seguradora</TableHead>
                <TableHead>Ramo</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead className="text-right">Prêmio</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentApolices.map((apolice: any) => (
                <TableRow
                  key={apolice.id}
                  className={apolice.status === 'pending' ? 'bg-blue-50/30' : ''}
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
              {recentApolices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    Nenhuma apólice registrada
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
