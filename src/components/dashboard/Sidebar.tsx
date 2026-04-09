'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, ClipboardList, Dumbbell, Users,
  BarChart3, Scale, ChevronLeft, ChevronRight,
  Inbox, UserCircle, Camera, X,
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = profile.role === 'admin'
  const navItems = isAdmin ? adminNavItems : userNavItems

  // ── Swipe gesture ──────────────────────────────────────────
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const SWIPE_THRESHOLD = 60   // px mínimos para considerar swipe
  const EDGE_ZONE = 30         // px da borda esquerda para abrir

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }

    function onTouchEnd(e: TouchEvent) {
      if (touchStartX.current === null || touchStartY.current === null) return

      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dy = e.changedTouches[0].clientY - touchStartY.current

      // Ignora se o movimento foi mais vertical do que horizontal
      if (Math.abs(dy) > Math.abs(dx)) return

      // Swipe direita → abre (só se começou na borda esquerda)
      if (dx > SWIPE_THRESHOLD && touchStartX.current < EDGE_ZONE) {
        setMobileOpen(true)
      }

      // Swipe esquerda → fecha
      if (dx < -SWIPE_THRESHOLD && mobileOpen) {
        setMobileOpen(false)
      }

      touchStartX.current = null
      touchStartY.current = null
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [mobileOpen])

  // Fecha o mobile sidebar ao navegar
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // ── Nav content (compartilhado entre mobile e desktop) ─────
  function NavContent({ onClose }: { onClose?: () => void }) {
    return (
      <>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border gap-2.5 flex-shrink-0">
          <div className="flex-shrink-0"><SophitLogo size={32} /></div>
          <span className="font-bold text-lg tracking-widest flex-1" style={{
            background: 'linear-gradient(135deg,#f97316,#c2410c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            SOPHIT
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Role badge */}
        <div className="px-4 pt-4">
          <span className={cn('badge text-xs', isAdmin
            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
            : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
          )}>
            {isAdmin ? 'Administrador' : 'Aluno'}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-2 space-y-1 mt-2 overflow-y-auto">
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
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </>
    )
  }

  return (
    <>
      {/* ── MOBILE SIDEBAR ──────────────────────────────────── */}

      {/* Overlay escuro */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer mobile */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-card border-r border-border',
        'transform transition-transform duration-300 ease-in-out lg:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavContent onClose={() => setMobileOpen(false)} />

        {/* Swipe hint */}
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            ← Arraste para fechar
          </p>
        </div>
      </div>

      {/* Botão hamburguer mobile (visível quando fechado) */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-card border border-border shadow-md lg:hidden"
          aria-label="Abrir menu"
        >
          <div className="flex flex-col gap-1">
            <span className="block w-5 h-0.5 rounded-full" style={{background:'#f97316'}} />
            <span className="block w-5 h-0.5 rounded-full" style={{background:'#f97316'}} />
            <span className="block w-3.5 h-0.5 rounded-full" style={{background:'#f97316'}} />
          </div>
        </button>
      )}

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      <aside className={cn(
        'hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}>
        {/* Logo */}
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

        {/* Role badge */}
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

        {/* Nav */}
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

        {/* Collapse toggle */}
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
    </>
  )
}
