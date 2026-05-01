import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { mockAvisos } from '@/lib/mock-data'
import { PlayCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@vipprime.com.br')
  const [password, setPassword] = useState('password123')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex w-full font-sans">
      {/* Left Column */}
      <div className="hidden lg:flex flex-[1.3] bg-nexus-navy p-12 flex-col text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,76,116,0.8),transparent_50%)]" />

        <div className="z-10 mt-auto mb-12">
          <Tabs defaultValue="boas-vindas" className="w-full max-w-lg">
            <TabsList className="bg-nexus-blue/50 text-white border-none mb-8">
              <TabsTrigger
                value="boas-vindas"
                className="data-[state=active]:bg-nexus-gold data-[state=active]:text-nexus-navy"
              >
                Boas-vindas
              </TabsTrigger>
              <TabsTrigger
                value="avisos"
                className="data-[state=active]:bg-nexus-gold data-[state=active]:text-nexus-navy"
              >
                Avisos do Sistema
              </TabsTrigger>
            </TabsList>

            <TabsContent value="boas-vindas" className="space-y-6 animate-fade-in">
              <h2 className="text-3xl font-bold text-nexus-gold">Bem-vindo ao NEXUS</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                A plataforma definitiva para gestão de seguros da VIP PRIME. Automatize processos,
                acompanhe comissões em tempo real e potencialize seus resultados.
              </p>
              <div className="aspect-video bg-black/40 rounded-xl flex items-center justify-center border border-nexus-blue hover:bg-black/50 transition-colors cursor-pointer group">
                <PlayCircle className="w-16 h-16 text-nexus-gold group-hover:scale-110 transition-transform" />
              </div>
            </TabsContent>

            <TabsContent value="avisos" className="space-y-4 animate-fade-in">
              <h2 className="text-2xl font-bold text-nexus-gold mb-6">Últimos Avisos</h2>
              {mockAvisos.map((aviso) => (
                <div
                  key={aviso.id}
                  className="bg-nexus-blue/30 p-4 rounded-lg border border-nexus-blue/50 hover:bg-nexus-blue/50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white">{aviso.title}</h3>
                    <span className="text-xs text-nexus-gold">{aviso.date}</span>
                  </div>
                  <p className="text-sm text-gray-300">{aviso.desc}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="z-10 mt-auto text-sm text-gray-400">
          &copy; {new Date().getFullYear()} VIP PRIME Corretora de Seguros.
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md space-y-10">
          <div className="lg:hidden mb-12">
            <Logo darkBg={false} />
          </div>

          <div className="text-center lg:text-left space-y-2">
            <div className="hidden lg:block mb-10">
              <Logo darkBg={false} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Acessar Conta</h1>
            <p className="text-gray-500">Insira suas credenciais para entrar no NEXUS.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                E-mail corporativo
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@vipprime.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-gray-300 focus-visible:ring-nexus-blue"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700">
                  Senha
                </Label>
                <a
                  href="#"
                  className="text-sm font-medium text-nexus-blue hover:text-nexus-navy hover:underline"
                >
                  Esqueci a senha
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-gray-300 focus-visible:ring-nexus-blue"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-nexus-blue hover:bg-nexus-navy text-nexus-gold font-semibold text-lg transition-colors"
            >
              Entrar no NEXUS
            </Button>
          </form>

          <div className="text-center text-xs text-gray-400 mt-12">NEXUS v0.0.1 (82a9423)</div>
        </div>
      </div>
    </div>
  )
}
