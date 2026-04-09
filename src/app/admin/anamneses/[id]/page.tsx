import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, User, Calendar } from 'lucide-react'
import Link from 'next/link'
import { FeedbackForm } from '@/components/admin/FeedbackForm'

const OBJETIVO_MAP: Record<string, string> = {
  prevencao: 'Prevenção', condicionamento: 'Condicionamento físico',
  lazer: 'Lazer', estetica: 'Estética', outros: 'Outros',
}
const EXERCICIO_MAP: Record<string, string> = {
  musculacao: 'Musculação', natacao: 'Natação', peso_corporal: 'Peso do corpo',
  esteira: 'Esteira', bike: 'Bike', lutas: 'Lutas', outros: 'Outros',
}
const INTENSIDADE_MAP: Record<string, string> = {
  leve: 'Leve', moderada: 'Moderada', vigorosa: 'Vigorosa',
}

function Detalhe({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-5 gap-2 text-sm py-1.5 border-b border-border/40 last:border-0">
      <span className="col-span-2 text-muted-foreground">{label}</span>
      <span className="col-span-3 text-foreground font-medium">{value}</span>
    </div>
  )
}

function SimNaoDetalhe({ label, value, descricao }: { label: string; value?: string; descricao?: string }) {
  if (!value) return null
  const isSim = value === 'sim'
  return (
    <div className="py-1.5 border-b border-border/40 last:border-0">
      <div className="grid grid-cols-5 gap-2 text-sm">
        <span className="col-span-2 text-muted-foreground">{label}</span>
        <span className={`col-span-3 font-medium ${isSim ? 'text-amber-600 dark:text-amber-400' : 'text-brand-600'}`}>
          {isSim ? 'Sim' : 'Não'}
        </span>
      </div>
      {isSim && descricao && (
        <p className="text-sm text-foreground mt-1 ml-[40%] bg-muted/50 rounded-md px-3 py-1.5">{descricao}</p>
      )}
    </div>
  )
}

export default async function AnamneseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: anamnese } = await supabase
    .from('anamneses')
    .select('*, profiles(id, full_name, email, avatar_url, created_at)')
    .eq('id', params.id)
    .single()

  if (!anamnese) notFound()

  const profile = anamnese.profiles as any
  const d = anamnese.data as Record<string, any>

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/admin/anamneses"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para inbox
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">

          {/* Identificação */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Anamnese</h2>
              <span className={anamnese.status === 'pendente' ? 'badge badge-pending' : 'badge badge-done'}>
                {anamnese.status === 'pendente' ? 'Pendente' : 'Respondido'}
              </span>
            </div>

            {/* Identificação */}
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">Identificação</h3>
              <Detalhe label="Nome" value={d.nome} />
              <Detalhe label="Idade" value={d.idade ? `${d.idade} anos` : undefined} />
              <Detalhe label="Sexo" value={d.sexo} />
            </div>

            {/* Objetivos */}
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">Objetivos e Preferências</h3>
              <Detalhe
                label="Objetivos"
                value={d.objetivos?.map((o: string) => OBJETIVO_MAP[o] ?? o).join(', ')}
              />
              {d.objetivos_outros && <Detalhe label="Outros objetivos" value={d.objetivos_outros} />}
              <Detalhe label="Disponibilidade" value={d.disponibilidade_dias && `${d.disponibilidade_dias} — ${d.disponibilidade_minutos} min/dia`} />
              <Detalhe
                label="Exercícios preferidos"
                value={d.tipos_exercicio?.map((e: string) => EXERCICIO_MAP[e] ?? e).join(', ')}
              />
              {d.tipos_exercicio_outros && <Detalhe label="Outros exercícios" value={d.tipos_exercicio_outros} />}
              <SimNaoDetalhe label="Não gosta de algo?" value={d.nao_gosta} descricao={d.nao_gosta_descricao} />
            </div>

            {/* Histórico físico */}
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">Histórico de Atividade Física (últimos 3 meses)</h3>
              <Detalhe label="Praticou exercício?" value={d.praticou_exercicio === 'sim' ? 'Sim' : 'Não'} />
              {d.praticou_exercicio === 'sim' && (
                <>
                  <Detalhe label="Tipo de exercício" value={d.exercicio_tipo} />
                  <Detalhe label="Frequência" value={d.exercicio_vezes_semana && `${d.exercicio_vezes_semana}x por semana`} />
                  <Detalhe label="Duração" value={d.exercicio_minutos_dia && `${d.exercicio_minutos_dia} min/dia`} />
                  <Detalhe label="Intensidade" value={d.exercicio_intensidade ? INTENSIDADE_MAP[d.exercicio_intensidade] : undefined} />
                </>
              )}
            </div>

            {/* Saúde */}
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">Histórico de Saúde</h3>
              <SimNaoDetalhe label="Tem doenças diagnosticadas?" value={d.tem_doenca} descricao={d.doencas} />
              <Detalhe label="Medicamentos de uso contínuo" value={d.medicamentos || 'Nenhum'} />
              <SimNaoDetalhe label="Fez cirurgia?" value={d.fez_cirurgia} descricao={d.cirurgia_regioes} />
            </div>

            {/* Dores */}
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">Dores e Limitações</h3>
              <SimNaoDetalhe label="Tem dor muscular atual?" value={d.tem_dor} />
              {d.tem_dor === 'sim' && d.dor_regioes?.length > 0 && (
                <div className="ml-4 mt-2 space-y-2">
                  {d.dor_regioes.filter((r: any) => r.regiao).map((r: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{r.regiao}</span>
                        <span className={`font-bold text-lg ${
                          r.nota <= 3 ? 'text-brand-600' : r.nota <= 6 ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {r.nota}/10
                        </span>
                      </div>
                      {r.dificuldade && (
                        <p className="text-muted-foreground mt-1">{r.dificuldade}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <SimNaoDetalhe label="Dor no peito ao exercitar?" value={d.dor_peito_exercicio} />
              <SimNaoDetalhe label="Tontura ou perda de consciência?" value={d.tontura_desmaio} />
              <SimNaoDetalhe label="Desconforto em atividades diárias?" value={d.desconforto_atividades} descricao={d.desconforto_descricao} />
              <SimNaoDetalhe label="Histórico cardíaco familiar?" value={d.historico_cardiaco_familiar} />
              <SimNaoDetalhe label="Lesões musculares/articulares?" value={d.teve_lesao} descricao={d.lesao_descricao} />
              <SimNaoDetalhe label="Limitações de movimento?" value={d.tem_limitacao} descricao={d.limitacao_descricao} />
            </div>

            {d.informacoes_adicionais && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Informações adicionais</p>
                <p className="text-sm text-foreground">{d.informacoes_adicionais}</p>
              </div>
            )}
          </div>

          <FeedbackForm
            anamneseId={anamnese.id}
            existingFeedback={anamnese.feedback_admin}
            status={anamnese.status}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Aluno</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-brand-600 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {(profile?.full_name ?? profile?.email ?? 'U')
                    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{profile?.full_name ?? 'Sem nome'}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <Link href={`/admin/usuarios/${profile?.id}`} className="text-brand-600 hover:underline">
                  Ver perfil completo
                </Link>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Enviado em {format(new Date(anamnese.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
