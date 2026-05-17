import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Login from './pages/Login'
import Index from './pages/Index'
import Apolices from './pages/Apolices'
import NotFound from './pages/NotFound'

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
    <div className="p-4 bg-nexus-blue/10 rounded-full">
      <div className="w-16 h-16 bg-nexus-blue rounded-full flex items-center justify-center text-nexus-gold font-bold text-2xl">
        {title.charAt(0)}
      </div>
    </div>
    <h2 className="text-2xl font-semibold text-gray-800">Módulo {title}</h2>
    <p className="text-gray-500 max-w-md">
      Esta tela faz parte da especificação e será implementada em futuras iterações do NEXUS.
    </p>
  </div>
)

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/apolices" element={<Apolices />} />

              {/* Placeholders for other routes defined in the specification */}
              <Route path="/parcelas" element={<PlaceholderPage title="Parcelas" />} />
              <Route path="/comissoes" element={<PlaceholderPage title="Comissões" />} />
              <Route path="/extratos" element={<PlaceholderPage title="Extratos" />} />
              <Route path="/clientes" element={<PlaceholderPage title="Clientes" />} />
              <Route path="/seguradoras" element={<PlaceholderPage title="Seguradoras" />} />
              <Route path="/relatorios" element={<PlaceholderPage title="Relatórios" />} />

              <Route path="/repasses" element={<PlaceholderPage title="Repasses" />} />
              <Route path="/usuarios" element={<PlaceholderPage title="Usuários" />} />
              <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" />} />
              <Route path="/importacao" element={<PlaceholderPage title="Importação" />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
