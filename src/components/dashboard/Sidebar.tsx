'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, ClipboardList, Dumbbell, Users,
  BarChart3, Scale, ChevronLeft, ChevronRight,
  Inbox, UserCircle, Camera,
} from 'lucide-react'
import { SophitLogo } from '@/components/SophitLogo'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'

interface SidebarProps { profile: Profile }

const userNavItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/dashboard/anamnese', label: 'Anamnese', icon: ClipboardList },
  { href: '/dashboard/treinos', label: 'Meus Treinos', icon: Dumbbell },
  { href: '/dashboard/progresso', label: 'Meu Progresso', icon: Camera },
  { href: '/dashboard/perfil', label: 'Perfil', icon: UserCircle },
]

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/anamneses', label: 'Inbox Anamneses', icon: Inbox },
  { href: '/admin/avaliacoes', label: 'Avaliações Físicas', icon: Scale },
  { href: '/admin/treinos', label: 'Gestor de Treinos', icon: Dumbbell },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isAdmin = profile.role === 'admin'
  const navItems = isAdmin ? adminNavItems : userNavItems

  return (
    <aside className={cn(
      'flex flex-col border-r border-border bg-card transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex items-center h-16 px-4 border-b border-border gap-2.5">
        <div className="flex-shrink-0"><SophitLogo size={32} /></div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-widest" style={{
            background: 'linear-gradient(135deg,#f97316,#c2410c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            SOPHIT
          </span>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pt-4">
          <span className={cn('badge text-xs', isAdmin
            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
            : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
          )}>
            {isAdmin ? 'Administrador' : 'Aluno'}
          </span>
        </div>
      )}

      <nav className="flex-1 p-2 space-y-1 mt-2">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard' || item.href === '/admin'
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground',
            'hover:bg-muted rounded-lg transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <><ChevronLeft className="h-4 w-4" /><span>Recolher</span></>
          }
        </button>
      </div>
    </aside>
  )
}
