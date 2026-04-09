'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sun, Moon, Bell, LogOut, ChevronDown } from 'lucide-react'
import type { Profile } from '@/types'

interface HeaderProps { profile: Profile }

export function Header({ profile }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isDark, setIsDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleDark() {
    const html = document.documentElement
    html.classList.toggle('dark')
    const nowDark = html.classList.contains('dark')
    setIsDark(nowDark)
    localStorage.setItem('theme', nowDark ? 'dark' : 'light')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = (profile.full_name ?? profile.email)
    .split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
      {/* Espaço para o botão hamburguer no mobile */}
      <div className="w-10 lg:w-0" />

      <div className="flex items-center gap-2">
        <button onClick={toggleDark} className="btn-ghost p-2" aria-label="Alternar tema">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button className="btn-ghost p-2 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full" style={{background:'#f97316'}} />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{background:'linear-gradient(135deg,#f97316,#c2410c)'}}>
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground leading-tight">
                {profile.full_name ?? 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-52 card p-1 shadow-lg animate-slide-up">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-xs text-muted-foreground">Conectado como</p>
                  <p className="text-sm font-medium text-foreground truncate">{profile.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
