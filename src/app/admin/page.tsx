import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Inbox,
  Dumbbell,
  Scale,
  Clock,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: totalUsers },
    { count: totalAnamneses },
    { count: pendentes },
    { count: totalTreinos },
    { count: totalAvaliacoes },
    { data: recentAnamneses },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('anamneses').select('*', { count: 'exact', head: true }),
    supabase.from('anamneses').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
    supabase.from('treinos').select('*', { count: 'exact', head: true }),
    supabase.from('avaliacoes_fisicas').select('*', { count: 'exact', head: true }),
    supabase
      .from('anamneses')
      .select('*, profiles(full_name, email)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Alunos ativos', value: totalUsers ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', href: '/admin/usuarios' },
    { label: 'Anamneses pendentes', value: pendentes ?? 0, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', href: '/admin/anamneses' },
    { label: 'Treinos criados', value: totalTreinos ?? 0, icon: Dumbbell, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', href: '/admin/treinos' },
    { label: 'Avaliações realizadas', value: totalAvaliacoes ?? 0, icon: Scale, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20', href: '/admin/avaliacoes' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel do Administrador</h1>
        <p className="text-muted-foreground mt-1">Visão geral da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2.5 rounded-lg ${stat.color} mb-4`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Anamneses */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Inbox className="h-4 w-4 text-brand-600" />
              Anamneses Pendentes
            </h2>
            <Link
              href="/admin/anamneses"
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Ver inbox <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentAnamneses && recentAnamneses.length > 0 ? (
            <div className="space-y-2">
              {recentAnamneses.map(a => {
                const profile = a.profiles as any
                const initials = (profile?.full_name ?? profile?.email ?? 'U')
                  .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
                return (
                  <Link
                    key={a.id}
                    href={`/admin/anamneses/${a.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-semibold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {profile?.full_name ?? profile?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.created_at), "dd 'de' MMM", { locale: ptBR })}
                      </p>
                    </div>
                    <span className="badge badge-pending">Pendente</span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">Tudo em dia!</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="font-semibold text-foreground mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            {[
              { label: 'Criar novo treino', href: '/admin/treinos', icon: Dumbbell, desc: 'Monte e atribua treinos para alunos' },
              { label: 'Registrar avaliação', href: '/admin/avaliacoes', icon: Scale, desc: 'Registre medidas e composição corporal' },
              { label: 'Ver todos os alunos', href: '/admin/usuarios', icon: Users, desc: `${totalUsers ?? 0} alunos cadastrados` },
              { label: 'Inbox de anamneses', href: '/admin/anamneses', icon: Inbox, desc: `${pendentes ?? 0} aguardando resposta` },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                  <action.icon className="h-4 w-4 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
