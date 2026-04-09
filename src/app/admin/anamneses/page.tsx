import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Inbox, Clock, CheckCircle2, Search } from 'lucide-react'

export default async function AdminAnamnesePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: anamneses } = await supabase
    .from('anamneses')
    .select('*, profiles(id, full_name, email, avatar_url)')
    .order('created_at', { ascending: false })

  const pendentes = anamneses?.filter(a => a.status === 'pendente') ?? []
  const respondidas = anamneses?.filter(a => a.status === 'respondido') ?? []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Inbox className="h-6 w-6 text-brand-600" />
            Inbox de Anamneses
          </h1>
          <p className="text-muted-foreground mt-1">
            {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''} de resposta
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar anamnese..."
            className="input-base pl-9 w-64"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total recebidas', value: anamneses?.length ?? 0, icon: Inbox, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
          { label: 'Pendentes', value: pendentes.length, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Respondidas', value: respondidas.length, icon: CheckCircle2, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Aguardando resposta
          </h2>
          <div className="card divide-y divide-border overflow-hidden">
            {pendentes.map(a => {
              const profile = a.profiles as any
              const initials = (profile?.full_name ?? profile?.email ?? 'U')
                .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
              return (
                <Link
                  key={a.id}
                  href={`/admin/anamneses/${a.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground">
                        {profile?.full_name ?? profile?.email}
                      </p>
                      <span className="badge badge-pending">Pendente</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {(a.data as any)?.objetivo_principal ?? 'Sem descrição'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {format(new Date(a.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Respondidas */}
      {respondidas.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Respondidas
          </h2>
          <div className="card divide-y divide-border overflow-hidden opacity-80">
            {respondidas.map(a => {
              const profile = a.profiles as any
              const initials = (profile?.full_name ?? profile?.email ?? 'U')
                .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
              return (
                <Link
                  key={a.id}
                  href={`/admin/anamneses/${a.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-muted-foreground text-sm font-semibold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {profile?.full_name ?? profile?.email}
                      </p>
                      <span className="badge badge-done">Respondido</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {(a.data as any)?.objetivo_principal ?? 'Sem descrição'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {format(new Date(a.created_at), "dd MMM", { locale: ptBR })}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {(!anamneses || anamneses.length === 0) && (
        <div className="text-center py-16">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">Nenhuma anamnese recebida ainda</p>
        </div>
      )}
    </div>
  )
}
