import { useEffect, useState } from 'react'
import { DashboardCharts } from '@/components/DashboardCharts'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck, Users, Building2, TrendingUp } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function Index() {
  const [stats, setStats] = useState({
    activePolicies: 0,
    totalClients: 0,
    totalInsurers: 0,
    monthlyPremium: 0,
  })

  const loadStats = async () => {
    try {
      const [policies, clients, insurers] = await Promise.all([
        pb.collection('policies').getFullList(),
        pb.collection('clients').getFullList(),
        pb.collection('insurers').getFullList(),
      ])

      const active = policies.filter((p) => p.status === 'active')
      const premium = active.reduce((acc, curr) => acc + curr.total_premium, 0)

      setStats({
        activePolicies: active.length,
        totalClients: clients.length,
        totalInsurers: insurers.length,
        monthlyPremium: premium,
      })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  useRealtime('policies', loadStats)
  useRealtime('clients', loadStats)
  useRealtime('insurers', loadStats)

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
        <p className="text-gray-500 mt-1">Visão geral do sistema NEXUS de gestão de seguros.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-elevation">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-nexus-blue rounded-2xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Apólices Ativas</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.activePolicies}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elevation">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Clientes</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalClients}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elevation">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Seguradoras</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalInsurers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-elevation">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Prêmio Ativo</p>
              <h3 className="text-2xl font-bold text-gray-900">
                R$ {stats.monthlyPremium.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts />
    </div>
  )
}
