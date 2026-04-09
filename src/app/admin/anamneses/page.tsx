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
    <div className="max-w-5xl mx-auto px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Inbox className="h-5 w-5 flex-shrink-0" style={{color:'#f97316'}} />
            Inbox de Anamneses
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''} de resposta
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="search" placeholder="Buscar anamnese..." className="input-base pl-9 w-full sm:w-56" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total recebidas', value: anamneses?.length ?? 0, icon: Inbox, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Pendentes', value: pendentes.length, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Respondidas', value: respondidas.length, icon: CheckCircle2, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
        ].map(s => (
          <div key={s.label} className="card p-3 sm:p-4">
            <div className={`inline-flex p-2 rounded-lg ${s.color} mb-2`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Aguardando resposta
          </h2>
          <div className="card divide-y divide-border overflow-hidden">
            {pendentes.map(a => {
              const profile = a.profiles as any
              const initials = (profile?.full_name ?? profile?.email ?? 'U')
                .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
              return (
                <Link key={a.id} href={`/admin/anamneses/${a.id}`}
                  className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{background:'linear-gradient(135deg,#f97316,#c2410c)'}}>
                    <span className="text-white text-xs font-semibold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {profile?.full_name ?? profile?.email}
                      </p>
                      <span className="badge badge-pending text-xs">Pendente</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {(a.data as any)?.objetivo_principal ?? 'Sem descrição'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
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
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Respondidas
          </h2>
          <div className="card divide-y divide-border overflow-hidden opacity-80">
            {respondidas.map(a => {
              const profile = a.profiles as any
              const initials = (profile?.full_name ?? profile?.email ?? 'U')
                .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
              return (
                <Link key={a.id} href={`/admin/anamneses/${a.id}`}
                  className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-muted-foreground text-xs font-semibold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-muted-foreground truncate">
                        {profile?.full_name ?? profile?.email}
                      </p>
                      <span className="badge badge-done text-xs">Respondido</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {(a.data as any)?.objetivo_principal ?? 'Sem descrição'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
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
