import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3, Users, ClipboardList, Dumbbell, Scale, TrendingUp, ArrowRight } from 'lucide-react'
import { RelatoriosCharts } from '@/components/admin/RelatoriosCharts'
import Link from 'next/link'

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
    supabase.from('avaliacoes_fisicas')
      .select('user_id, peso, altura, imc, percentual_gordura, massa_magra, medidas_completas, medidas, composicao, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('treinos').select('user_id, created_at').order('created_at'),
  ])

  const taxaResposta = totalAnamneses ? Math.round(((respondidas ?? 0) / totalAnamneses) * 100) : 0

  const alunosEngajamento = (profiles ?? []).map(p => {
    const minhasAnamneses  = (anamnesesRaw ?? []).filter(a => a.user_id === p.id)
    const meusTreinos      = (treinosRaw ?? []).filter(t => t.user_id === p.id)
    const minhasAvaliacoes = (avaliacoesRaw ?? []).filter(a => a.user_id === p.id)
    const minhaProgressao  = (progressaoRaw ?? []).filter(x => x.user_id === p.id)
    const score = Math.min(100,
      Math.min(25, minhasAnamneses.length * 12) +
      Math.min(25, meusTreinos.length * 8) +
      Math.min(25, minhasAvaliacoes.length * 12) +
      Math.min(25, minhaProgressao.length * 3)
    )
    const ultimaAv   = minhasAvaliacoes[0] ?? null
    const primeiraAv = minhasAvaliacoes[minhasAvaliacoes.length - 1] ?? null
    const evolucaoPeso = ultimaAv && primeiraAv && ultimaAv.id !== primeiraAv.id
      ? Number(ultimaAv.peso) - Number(primeiraAv.peso) : null
    const evolucaoGordura = ultimaAv && primeiraAv && ultimaAv.id !== primeiraAv.id
      ? Number(ultimaAv.percentual_gordura ?? (ultimaAv.composicao as any)?.perc_gordura)
        - Number(primeiraAv.percentual_gordura ?? (primeiraAv.composicao as any)?.perc_gordura)
      : null
    const ultimaMedidas = ultimaAv ? {
      peso: ultimaAv.peso, altura: ultimaAv.altura, imc: ultimaAv.imc,
      gordura: ultimaAv.percentual_gordura ?? (ultimaAv.composicao as any)?.perc_gordura,
      massaMagra: ultimaAv.massa_magra ?? (ultimaAv.composicao as any)?.massa_livre_gordura,
      cintura: (ultimaAv.medidas_completas as any)?.cintura ?? (ultimaAv.medidas as any)?.cintura,
      quadril: (ultimaAv.medidas_completas as any)?.quadril ?? (ultimaAv.medidas as any)?.quadril,
    } : null
    return { id: p.id, nome: p.full_name ?? p.email, email: p.email, score,
      anamneses: minhasAnamneses.length, treinos: meusTreinos.length,
      avaliacoes: minhasAvaliacoes.length, registrosCarga: minhaProgressao.length,
      evolucaoPeso, evolucaoGordura, evolucaoCargaMedia: null, ultimaMedidas }
  }).sort((a, b) => b.score - a.score)

  const meses: { mes: string; anamneses: number; avaliacoes: number; registros: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const mesStr = d.toISOString().slice(0, 7)
    meses.push({
      mes: d.toLocaleDateString('pt-BR', { month: 'short' }),
      anamneses: (anamnesesRaw ?? []).filter(a => a.created_at?.startsWith(mesStr)).length,
      avaliacoes: (avaliacoesRaw ?? []).filter(a => a.created_at?.startsWith(mesStr)).length,
      registros:  (progressaoRaw ?? []).filter(p => p.data_registro?.startsWith(mesStr)).length,
    })
  }

  const stats = [
    { label:'Total de alunos',    value:totalUsers??0,     icon:Users,        cor:'#3b82f6', bg:'bg-blue-50 dark:bg-blue-900/20' },
    { label:'Anamneses enviadas', value:totalAnamneses??0, icon:ClipboardList, cor:'#f97316', bg:'bg-orange-50 dark:bg-orange-900/20' },
    { label:'Pendentes',          value:pendentes??0,      icon:ClipboardList, cor:'#f59e0b', bg:'bg-amber-50 dark:bg-amber-900/20' },
    { label:'Respondidas',        value:respondidas??0,    icon:TrendingUp,   cor:'#22c55e', bg:'bg-green-50 dark:bg-green-900/20' },
    { label:'Treinos criados',    value:totalTreinos??0,   icon:Dumbbell,     cor:'#a855f7', bg:'bg-purple-50 dark:bg-purple-900/20' },
    { label:'Avaliações físicas', value:totalAvaliacoes??0,icon:Scale,        cor:'#f97316', bg:'bg-orange-50 dark:bg-orange-900/20' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6" style={{color:'#f97316'}} />
          Relatórios & Desempenho
        </h1>
        <p className="text-muted-foreground mt-1">Visão geral da plataforma e evolução dos alunos</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-5">
            <div className={`inline-flex p-2.5 rounded-lg ${s.bg} mb-3`}>
              <s.icon className="h-5 w-5" style={{color:s.cor}} />
            </div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <RelatoriosCharts
        taxaResposta={taxaResposta}
        respondidas={respondidas??0}
        totalAnamneses={totalAnamneses??0}
        alunosEngajamento={alunosEngajamento}
        atividadeMensal={meses}
      />

      {/* Tabela de avaliações por aluno */}
      <div className="card p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Scale className="h-4 w-4" style={{color:'#f97316'}} />
          Dados de Avaliação Física por Aluno
        </h2>
        {alunosEngajamento.filter(a => a.ultimaMedidas).length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Nenhuma avaliação física registrada ainda</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Aluno','Peso','Altura','IMC','% Gordura','Massa Magra','Cintura','Quadril','Aval.',''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground py-2 px-3 first:pl-0 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alunosEngajamento.map(a => {
                  const m = a.ultimaMedidas
                  if (!m) return null
                  const imcN = m.imc ? Number(m.imc) : null
                  const imcColor = imcN ? (imcN < 18.5 ? '#3b82f6' : imcN < 25 ? '#16a34a' : imcN < 30 ? '#f59e0b' : '#ef4444') : undefined
                  return (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 pl-0">
                        <p className="font-medium text-foreground">{a.nome}</p>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap">{m.peso ? `${m.peso} kg` : '—'}</td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap">{m.altura ? `${m.altura} cm` : '—'}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {imcN ? <span className="font-semibold" style={{color:imcColor}}>{imcN.toFixed(1)}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap">{m.gordura ? `${m.gordura}%` : '—'}</td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap">{m.massaMagra ? `${parseFloat(String(m.massaMagra)).toFixed(1)} kg` : '—'}</td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap">{m.cintura ? `${m.cintura} cm` : '—'}</td>
                      <td className="py-3 px-3 text-foreground whitespace-nowrap">{m.quadril ? `${m.quadril} cm` : '—'}</td>
                      <td className="py-3 px-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 font-medium">{a.avaliacoes}</span>
                      </td>
                      <td className="py-3 px-3">
                        <Link href={`/admin/usuarios/${a.id}`} className="inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{color:'#ea580c'}}>
                          Ver perfil <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
