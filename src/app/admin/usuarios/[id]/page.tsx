import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Dumbbell, Calendar, Target } from 'lucide-react'
import Link from 'next/link'
import { AvaliacaoForm } from '@/components/admin/AvaliacaoForm'
import { EvolutionCharts } from '@/components/admin/EvolutionCharts'
import { DeleteTreinoButton } from '@/components/admin/DeleteTreinoButton'
import { ProgressaoAdmin } from '@/components/admin/ProgressaoAdmin'
import { DeleteUserButton } from '@/components/admin/DeleteUserButton'
import { FotosProgresso } from '@/components/FotosProgresso'
import type { Exercicio } from '@/types'

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: avaliacoes }, { data: treinos }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', params.id).single(),
    supabase.from('avaliacoes_fisicas').select('*').eq('user_id', params.id).order('created_at'),
    supabase.from('treinos').select('*').eq('user_id', params.id).order('data_atribuicao', { ascending: false }),
  ])

  if (!profile) notFound()

  const lastAvaliacao = avaliacoes && avaliacoes.length > 0 ? avaliacoes[avaliacoes.length - 1] : null
  const initials = (profile.full_name ?? profile.email)
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Link href="/admin/usuarios" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar para usuários
      </Link>

      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-16 w-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{background:'linear-gradient(135deg,#f97316,#c2410c)'}}>
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{profile.full_name ?? 'Sem nome'}</h1>
            <p className="text-muted-foreground">{profile.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Membro desde {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <div className="mt-3">
              <DeleteUserButton
                userId={params.id}
                userName={profile.full_name ?? 'Sem nome'}
                userEmail={profile.email}
              />
            </div>
          </div>
          {lastAvaliacao && (
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Peso', value: `${lastAvaliacao.peso}kg` },
                { label: 'IMC', value: lastAvaliacao.imc?.toFixed(1) ?? '—' },
                { label: '% Gordura', value: lastAvaliacao.percentual_gordura ? `${lastAvaliacao.percentual_gordura}%` : '—' },
              ].map(s => (
                <div key={s.label} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Evolution Charts */}
      {avaliacoes && avaliacoes.length > 1 && (
        <div className="card p-6">
          <h2 className="font-semibold text-foreground mb-6">Evolução Corporal</h2>
          <EvolutionCharts avaliacoes={avaliacoes} />
        </div>
      )}

      {/* Treinos com progressão */}
      {treinos && treinos.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Dumbbell className="h-4 w-4" style={{color:'#f97316'}} />
              Treinos e Progressão de Cargas
            </h2>
            <Link href="/admin/treinos" className="text-xs font-medium" style={{color:'#ea580c'}}>
              + Novo treino
            </Link>
          </div>

          <div className="space-y-6">
            {treinos.map(t => {
              const exercicios: Exercicio[] = t.lista_exercicios ?? []
              return (
                <div key={t.id}>
                  {/* Header do treino */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{t.titulo}</h3>
                        <span className={t.ativo
                          ? 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                          : 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground'
                        }>
                          {t.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(t.data_atribuicao), 'dd/MM/yyyy')}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {exercicios.length} exercícios
                        </span>
                      </div>
                    </div>
                    <DeleteTreinoButton treinoId={t.id} titulo={t.titulo} />
                  </div>

                  {/* Lista resumida de exercícios */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {exercicios.map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30">
                        <span className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{background:'rgba(249,115,22,0.15)',color:'#ea580c'}}>
                          {i + 1}
                        </span>
                        <span className="font-medium text-foreground truncate">{ex.nome}</span>
                        <span className="text-muted-foreground ml-auto flex-shrink-0">
                          {ex.series}×{ex.reps}
                          {ex.carga ? ` · ${ex.carga}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Progressão de cargas */}
                  <ProgressaoAdmin
                    userId={params.id}
                    treinoId={t.id}
                    treinoTitulo={t.titulo}
                    exercicios={exercicios}
                  />

                  <div className="border-b border-border mt-6 last:hidden" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Fotos Antes/Depois */}
      <div className="card p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{background:'#f97316'}} />
          Fotos de Progresso
        </h2>
        <FotosProgresso userId={params.id} isAdmin={true} />
      </div>

      {/* Nova Avaliação */}
      <div>
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{background:'#f97316'}} />
          Nova Avaliação Física
        </h2>
        <AvaliacaoForm userId={params.id} userName={profile.full_name ?? profile.email} />
      </div>
    </div>
  )
}
// Note: DeleteUserButton already imported above
