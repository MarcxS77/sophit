import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { AvaliacaoForm } from '@/components/admin/AvaliacaoForm'
import { EvolutionCharts } from '@/components/admin/EvolutionCharts'
import { DeleteUserButton } from '@/components/admin/DeleteUserButton'
import { FotosProgresso } from '@/components/FotosProgresso'
import { TreinoCardAdmin } from '@/components/admin/TreinoCardAdmin'

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: avaliacoes }, { data: treinos }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', params.id).single(),
    supabase.from('avaliacoes_fisicas').select('*').eq('user_id', params.id).order('created_at'),
    supabase.from('treinos').select('*').eq('user_id', params.id).order('data_atribuicao', { ascending: true }).order('titulo', { ascending: true }),
  ])

  if (!profile) notFound()

  const lastAvaliacao = avaliacoes && avaliacoes.length > 0 ? avaliacoes[avaliacoes.length - 1] : null
  const initials = (profile.full_name ?? profile.email)
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-2 sm:px-0">
      <Link href="/admin/usuarios"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar para usuários
      </Link>

      {/* Profile Header */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#f97316,#c2410c)' }}>
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{profile.full_name ?? 'Sem nome'}</h1>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Membro desde {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <div className="mt-3">
              <DeleteUserButton userId={params.id} userName={profile.full_name ?? 'Sem nome'} userEmail={profile.email} />
            </div>
          </div>
          {lastAvaliacao && (
            <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
              {[
                { label: 'Peso', value: `${lastAvaliacao.peso}kg` },
                { label: 'IMC', value: lastAvaliacao.imc?.toFixed(1) ?? '—' },
                { label: '% Gordura', value: lastAvaliacao.percentual_gordura ? `${lastAvaliacao.percentual_gordura}%` : '—' },
              ].map(s => (
                <div key={s.label} className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p className="text-base sm:text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Evolution Charts */}
      {avaliacoes && avaliacoes.length > 1 && (
        <div className="card p-5 sm:p-6">
          <h2 className="font-semibold text-foreground mb-6">Evolução Corporal</h2>
          <EvolutionCharts avaliacoes={avaliacoes} />
        </div>
      )}

      {/* Treinos */}
      {treinos && treinos.length > 0 && (
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Dumbbell className="h-4 w-4" style={{ color: '#f97316' }} />
              Treinos e Progressão de Cargas
            </h2>
            <Link href="/admin/treinos" className="text-xs font-medium" style={{ color: '#ea580c' }}>
              + Novo treino
            </Link>
          </div>
          <div className="space-y-6">
            {treinos.map((t, i) => (
              <div key={t.id}>
                <TreinoCardAdmin treino={t} userId={params.id} />
                {i < treinos.length - 1 && <div className="border-b border-border mt-6" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fotos */}
      <div className="card p-5 sm:p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: '#f97316' }} />
          Fotos de Progresso
        </h2>
        <FotosProgresso userId={params.id} isAdmin={true} />
      </div>

      {/* Nova Avaliação */}
      <div>
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: '#f97316' }} />
          Nova Avaliação Física
        </h2>
        <AvaliacaoForm userId={params.id} userName={profile.full_name ?? profile.email} />
      </div>
    </div>
  )
}
