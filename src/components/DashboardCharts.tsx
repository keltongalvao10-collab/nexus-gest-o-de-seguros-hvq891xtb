import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format, parseISO, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['#073F60', '#0F4C74', '#FEC456', '#94a3b8', '#10b981', '#3b82f6', '#f59e0b']

export function DashboardCharts() {
  const [chartData, setChartData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])

  const loadData = async () => {
    try {
      const [policies, commissions] = await Promise.all([
        pb.collection('policies').getFullList({ expand: 'insurer' }),
        pb.collection('commissions').getFullList(),
      ])

      const monthlyData: Record<
        string,
        { name: string; producao: number; comissao: number; date: Date }
      > = {}
      const insurerData: Record<string, number> = {}

      const comissoesByPolicy = commissions.reduce(
        (acc, c) => {
          acc[c.policy] = (acc[c.policy] || 0) + c.amount
          return acc
        },
        {} as Record<string, number>,
      )

      policies.forEach((p) => {
        // Bar Chart Data
        const date = parseISO(p.start_date)
        const monthKey = format(startOfMonth(date), 'yyyy-MM')
        const monthName = format(date, 'MMM', { locale: ptBR })

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            producao: 0,
            comissao: 0,
            date: startOfMonth(date),
          }
        }

        const premium = p.total_premium || 0
        monthlyData[monthKey].producao += premium
        monthlyData[monthKey].comissao += comissoesByPolicy[p.id] || 0

        // Pie Chart Data
        const insurerName = p.expand?.insurer?.name || 'Desconhecida'
        if (!insurerData[insurerName]) {
          insurerData[insurerName] = 0
        }
        insurerData[insurerName] += 1
      })

      const sortedChartData = Object.values(monthlyData)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(-6)
      setChartData(sortedChartData)

      const formattedPieData = Object.entries(insurerData).map(([name, value]) => ({ name, value }))
      setPieData(formattedPieData)
    } catch (error) {
      console.error('Error loading chart data', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('policies', loadData)
  useRealtime('commissions', loadData)

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
      <Card className="col-span-4 border-none shadow-elevation">
        <CardHeader>
          <CardTitle>Produção vs Comissões</CardTitle>
          <CardDescription>Visão geral dos últimos meses</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b' }}
                />
                <RechartsTooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) =>
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                />
                <Bar
                  dataKey="producao"
                  name="Produção"
                  fill="#073F60"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="comissao"
                  name="Comissão (Est.)"
                  fill="#FEC456"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-3 border-none shadow-elevation">
        <CardHeader>
          <CardTitle>Distribuição por Seguradora</CardTitle>
          <CardDescription>Volume de apólices ativas</CardDescription>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Sem dados para exibir
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm text-gray-600">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                {entry.name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
