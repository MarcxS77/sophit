import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3, Users, ClipboardList, Dumbbell, Scale, TrendingUp } from 'lucide-react'
import { RelatoriosCharts } from '@/components/admin/RelatoriosCharts'

export default async function RelatoriosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: totalUsers },
    { count: totalAnamneses },
    { count: pendentes },
    { count: respondidas },
    { count: totalTreinos },
    { count: totalAvaliacoes },
    { data: profiles },
    { data: progressaoRaw },
    { data: anamnesesRaw },
    { data: avaliacoesRaw },
    { data: treinosRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('anamneses').select('*', { count: 'exact', head: true }),
    supabase.from('anamneses').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
    supabase.from('anamneses').select('*', { count: 'exact', head: true }).eq('status', 'respondido'),
    supabase.from('treinos').select('*', { count: 'exact', head: true }),
    supabase.from('avaliacoes_fisicas').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'user'),
    supabase.from('progressao_exercicios').select('user_id, carga, data_registro, exercicio_nome').order('data_registro'),
    supabase.from('anamneses').select('user_id, status, created_at').order('created_at'),
    supabase.from('avaliacoes_fisicas').select('user_id, peso, percentual_gordura, created_at').order('created_at'),
    supabase.from('treinos').select('user_id, created_at').order('created_at'),
  ])

  const taxaResposta = totalAnamneses ? Math.round(((respondidas ?? 0) / totalAnamneses) * 100) : 0

  // Calcula score de engajamento por aluno (0-100)
  const alunosEngajamento = (profiles ?? []).map(p => {
    const minhasAnamneses = (anamnesesRaw ?? []).filter(a => a.user_id === p.id)
    const meusTreinos = (treinosRaw ?? []).filter(t => t.user_id === p.id)
    const minhasAvaliacoes = (avaliacoesRaw ?? []).filter(a => a.user_id === p.id)
    const minhaProgressao = (progressaoRaw ?? []).filter(x => x.user_id === p.id)

    // Pontuação: anamneses (25pts), treinos atribuídos (25pts), avaliações (25pts), registros de carga (25pts)
    const ptAnamnese = Math.min(25, minhasAnamneses.length * 12)
    const ptTreino = Math.min(25, meusTreinos.length * 8)
    const ptAvaliacao = Math.min(25, minhasAvaliacoes.length * 12)
    const ptProgressao = Math.min(25, minhaProgressao.length * 3)
    const score = ptAnamnese + ptTreino + ptAvaliacao + ptProgressao

    // Calcula evolução de peso (última vs primeira avaliação)
    const evolucaoPeso = minhasAvaliacoes.length >= 2
      ? Number(minhasAvaliacoes[minhasAvaliacoes.length - 1].peso) - Number(minhasAvaliacoes[0].peso)
      : null

    // Calcula evolução de gordura
    const evolucaoGordura = minhasAvaliacoes.length >= 2
      ? Number(minhasAvaliacoes[minhasAvaliacoes.length - 1].percentual_gordura) - Number(minhasAvaliacoes[0].percentual_gordura)
      : null

    // Calcula evolução de carga (média)
    const exerciciosUnicos = [...new Set(minhaProgressao.map(x => x.exercicio_nome))]
    let totalEvolucaoCarga = 0
    let exerciciosComEvolucao = 0
    for (const ex of exerciciosUnicos) {
      const registros = minhaProgressao.filter(x => x.exercicio_nome === ex)
      if (registros.length >= 2) {
        const primeirasCarga = Number(registros[0].carga)
        const ultimaCarga = Number(registros[registros.length - 1].carga)
        totalEvolucaoCarga += ((ultimaCarga - primeirasCarga) / primeirasCarga) * 100
        exerciciosComEvolucao++
      }
    }
    const evolucaoCargaMedia = exerciciosComEvolucao > 0
      ? totalEvolucaoCarga / exerciciosComEvolucao
      : null

    return {
      id: p.id,
      nome: p.full_name ?? p.email,
      email: p.email,
      score: Math.min(100, score),
      anamneses: minhasAnamneses.length,
      treinos: meusTreinos.length,
      avaliacoes: minhasAvaliacoes.length,
      registrosCarga: minhaProgressao.length,
      evolucaoPeso,
      evolucaoGordura,
      evolucaoCargaMedia,
    }
  }).sort((a, b) => b.score - a.score)

  // Dados para gráfico de atividade mensal (últimos 6 meses)
  const meses: { mes: string; anamneses: number; avaliacoes: number; registros: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const mesStr = d.toISOString().slice(0, 7) // YYYY-MM
    const label = d.toLocaleDateString('pt-BR', { month: 'short' })

    meses.push({
      mes: label,
      anamneses: (anamnesesRaw ?? []).filter(a => a.created_at?.startsWith(mesStr)).length,
      avaliacoes: (avaliacoesRaw ?? []).filter(a => a.created_at?.startsWith(mesStr)).length,
      registros: (progressaoRaw ?? []).filter(p => p.data_registro?.startsWith(mesStr)).length,
    })
  }

  const stats = [
    { label: 'Total de alunos', value: totalUsers ?? 0, icon: Users, cor: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Anamneses enviadas', value: totalAnamneses ?? 0, icon: ClipboardList, cor: '#f97316', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Pendentes', value: pendentes ?? 0, icon: ClipboardList, cor: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Respondidas', value: respondidas ?? 0, icon: TrendingUp, cor: '#22c55e', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Treinos criados', value: totalTreinos ?? 0, icon: Dumbbell, cor: '#a855f7', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Avaliações físicas', value: totalAvaliacoes ?? 0, icon: Scale, cor: '#f97316', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6" style={{ color: '#f97316' }} />
          Relatórios & Desempenho
        </h1>
        <p className="text-muted-foreground mt-1">Visão geral da plataforma e evolução dos alunos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-5">
            <div className={`inline-flex p-2.5 rounded-lg ${s.bg} mb-3`}>
              <s.icon className="h-5 w-5" style={{ color: s.cor }} />
            </div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts — client component */}
      <RelatoriosCharts
        taxaResposta={taxaResposta}
        respondidas={respondidas ?? 0}
        totalAnamneses={totalAnamneses ?? 0}
        alunosEngajamento={alunosEngajamento}
        atividadeMensal={meses}
      />
    </div>
  )
}
