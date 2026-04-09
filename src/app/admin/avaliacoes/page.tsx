import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Scale, ArrowRight, Plus } from 'lucide-react'

export default async function AvaliacoesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: avaliacoes } = await supabase
    .from('avaliacoes_fisicas')
    .select('*, profiles(id, full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'user')
    .order('full_name')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Scale className="h-6 w-6 text-brand-600" />
            Avaliações Físicas
          </h1>
          <p className="text-muted-foreground mt-1">
            {avaliacoes?.length ?? 0} avaliações registradas
          </p>
        </div>
      </div>

      {/* Quick access: select user to evaluate */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-brand-600" />
          Nova Avaliação
        </h2>
        <div className="flex gap-3">
          <select className="input-base flex-1" id="user-select">
            <option value="">Selecione um aluno para avaliar...</option>
            {users?.map(u => (
              <option key={u.id} value={u.id}>
                {u.full_name ?? u.email}
              </option>
            ))}
          </select>
          <Link
            href="/admin/usuarios"
            className="btn-secondary whitespace-nowrap"
          >
            Ver perfil do aluno
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Para registrar uma avaliação, acesse o perfil do aluno via "Usuários"
        </p>
      </div>

      {/* Recent evaluations */}
      <div className="card divide-y divide-border overflow-hidden">
        {avaliacoes && avaliacoes.length > 0 ? (
          avaliacoes.map(av => {
            const profile = av.profiles as any
            const initials = (profile?.full_name ?? profile?.email ?? 'U')
              .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
            return (
              <Link
                key={av.id}
                href={`/admin/usuarios/${profile?.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{profile?.full_name ?? profile?.email}</p>
                  <div className="flex gap-3 mt-0.5">
                    {av.peso && <span className="text-xs text-muted-foreground">{av.peso}kg</span>}
                    {av.imc && <span className="text-xs text-muted-foreground">IMC {Number(av.imc).toFixed(1)}</span>}
                    {av.percentual_gordura && <span className="text-xs text-muted-foreground">{av.percentual_gordura}% gordura</span>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {format(new Date(av.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )
          })
        ) : (
          <div className="text-center py-16">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">Nenhuma avaliação registrada ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}
