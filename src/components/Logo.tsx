import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  darkBg?: boolean
  showSubtitle?: boolean
}

export function Logo({ className, darkBg = true, showSubtitle = true }: LogoProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="relative flex items-center justify-center mb-1">
        <div className="absolute w-16 h-8 bg-nexus-gold rounded-t-xl opacity-90" />
        <Lock className="relative z-10 w-6 h-6 text-nexus-navy" />
      </div>
      <div className="flex items-center gap-1 text-3xl font-bold tracking-tight">
        <span className="text-nexus-gold">VIP</span>
        <span className={darkBg ? 'text-white' : 'text-nexus-navy'}>PRIME</span>
      </div>
      {showSubtitle && (
        <div className="flex items-center gap-2 mt-1">
          <div className="h-px w-8 bg-gray-400/50" />
          <span className="text-sm font-medium text-gray-400 tracking-widest uppercase">
            Corretora de Seguros
          </span>
          <div className="h-px w-8 bg-gray-400/50" />
        </div>
      )}
    </div>
  )
}
