import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  PieChart,
  List,
  Users,
  Building,
  FileBarChart,
  ArrowRightLeft,
  UserCog,
  Settings,
  Upload,
  Bell,
  ChevronDown,
  LogOut,
  KeyRound,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { title: 'Painel de Controle', icon: FileText, path: '/apolices' },
  { title: 'Parcelas', icon: DollarSign, path: '/parcelas' },
  { title: 'Comissões', icon: PieChart, path: '/comissoes' },
  { title: 'Extratos', icon: List, path: '/extratos' },
  { title: 'Clientes', icon: Users, path: '/clientes' },
  { title: 'Seguradoras', icon: Building, path: '/seguradoras' },
  { title: 'Relatórios', icon: FileBarChart, path: '/relatorios' },
]

const adminItems = [
  { title: 'Repasses', icon: ArrowRightLeft, path: '/repasses' },
  { title: 'Usuários', icon: UserCog, path: '/usuarios' },
  { title: 'Configurações', icon: Settings, path: '/configuracoes' },
  { title: 'Importação', icon: Upload, path: '/importacao' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => navigate('/login')

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-nexus-bg">
        <Sidebar className="border-r-0">
          <SidebarHeader className="p-6 pb-2">
            <Logo className="scale-75 origin-left" />
          </SidebarHeader>
          <SidebarContent className="px-3 pt-4">
            <SidebarGroup>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.path}
                      className="data-[active=true]:bg-nexus-blue data-[active=true]:text-nexus-gold hover:bg-nexus-blue/50 hover:text-nexus-gold transition-colors"
                    >
                      <Link to={item.path}>
                        <item.icon className="mr-2 h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-nexus-gold/70 text-xs font-semibold uppercase tracking-wider">
                Administração
              </SidebarGroupLabel>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.path}
                      className="data-[active=true]:bg-nexus-blue data-[active=true]:text-nexus-gold hover:bg-nexus-blue/50 hover:text-nexus-gold transition-colors"
                    >
                      <Link to={item.path}>
                        <item.icon className="mr-2 h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 sticky top-0 z-10">
            <h1 className="text-xl font-semibold text-gray-800 capitalize">
              {location.pathname === '/'
                ? 'Dashboard'
                : location.pathname === '/apolices'
                  ? 'Painel de Controle'
                  : location.pathname.slice(1).replace(/-/g, ' ')}
            </h1>
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-500 hover:text-nexus-navy"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-nexus-gold rounded-full border border-white" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 hover:bg-gray-100"
                  >
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1" />
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium text-gray-700">Admin VIP</span>
                      <span className="text-xs text-gray-500">Administrador</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Trocar Senha</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair do NEXUS</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-8">
            <div className="mx-auto max-w-7xl animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
