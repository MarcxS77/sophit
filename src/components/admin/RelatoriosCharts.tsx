'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Trophy, Zap, Target } from 'lucide-react'

interface AlunoEngajamento {
  id: string
  nome: string
  email: string
  score: number
  anamneses: number
  treinos: number
  avaliacoes: number
  registrosCarga: number
  evolucaoPeso: number | null
  evolucaoGordura: number | null
  evolucaoCargaMedia: number | null
}

interface Props {
  taxaResposta: number
  respondidas: number
  totalAnamneses: number
  alunosEngajamento: AlunoEngajamento[]
  atividadeMensal: { mes: string; anamneses: number; avaliacoes: number; registros: number }[]
}

function GaugeMeter({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const half = circ / 2
  const progress = (value / 100) * half
  const angle = -180 + (value / 100) * 180

  const getColor = (v: number) => {
    if (v >= 70) return '#22c55e'
    if (v >= 40) return '#f97316'
    return '#ef4444'
  }

  const barColor = getColor(value)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 130, height: 75 }}>
        <svg width="130" height="75" viewBox="0 0 130 75">
          {/* Track */}
          <path
            d="M 10 70 A 55 55 0 0 1 120 70"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Progress */}
          <path
            d="M 10 70 A 55 55 0 0 1 120 70"
            fill="none"
            stroke={barColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 172} 172`}
          />
          {/* Needle */}
          <g transform={`rotate(${angle}, 65, 70)`}>
            <line x1="65" y1="70" x2="65" y2="22" stroke={barColor} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="65" cy="70" r="5" fill={barColor} />
          </g>
          {/* Value */}
          <text x="65" y="68" textAnchor="middle" fontSize="16" fontWeight="700" fill="hsl(var(--foreground))">
            {value}%
          </text>
        </svg>
      </div>
      <p className="text-xs font-medium text-muted-foreground text-center">{label}</p>
    </div>
  )
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f97316' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 text-xs shadow-lg">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export function RelatoriosCharts({ taxaResposta, respondidas, totalAnamneses, alunosEngajamento, atividadeMensal }: Props) {
  const totalRegistros = alunosEngajamento.reduce((acc, a) => acc + a.registrosCarga, 0)
  const mediaScore = alunosEngajamento.length
    ? Math.round(alunosEngajamento.reduce((acc, a) => acc + a.score, 0) / alunosEngajamento.length)
    : 0
  const taxaAvaliacao = alunosEngajamento.length
    ? Math.round((alunosEngajamento.filter(a => a.avaliacoes > 0).length / alunosEngajamento.length) * 100)
    : 0

  // Radar data para top aluno
  const topAluno = alunosEngajamento[0]
  const radarData = topAluno ? [
    { subject: 'Anamneses', value: Math.min(100, topAluno.anamneses * 25) },
    { subject: 'Treinos', value: Math.min(100, topAluno.treinos * 20) },
    { subject: 'Avaliações', value: Math.min(100, topAluno.avaliacoes * 25) },
    { subject: 'Progressão', value: Math.min(100, topAluno.registrosCarga * 5) },
    { subject: 'Engajamento', value: topAluno.score },
  ] : []

  return (
    <div className="space-y-6">

      {/* Medidores de KPI */}
      <div className="card p-6">
        <h2 className="font-semibold text-foreground mb-6 flex items-center gap-2">
          <Target className="h-4 w-4" style={{ color: '#f97316' }} />
          Medidores de desempenho geral
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <GaugeMeter value={taxaResposta} label="Taxa de resposta de anamneses" color="#f97316" />
            <p className="text-xs text-muted-foreground mt-1">{respondidas} de {totalAnamneses} respondidas</p>
          </div>
          <div className="flex flex-col items-center">
            <GaugeMeter value={mediaScore} label="Score médio de engajamento" color="#a855f7" />
            <p className="text-xs text-muted-foreground mt-1">{alunosEngajamento.length} alunos avaliados</p>
          </div>
          <div className="flex flex-col items-center">
            <GaugeMeter value={taxaAvaliacao} label="Alunos com avaliação física" color="#22c55e" />
            <p className="text-xs text-muted-foreground mt-1">{totalRegistros} registros de carga</p>
          </div>
        </div>
      </div>

      {/* Atividade mensal */}
      <div className="card p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4" style={{ color: '#f97316' }} />
          Atividade mensal (últimos 6 meses)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={atividadeMensal} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="anamneses" name="Anamneses" fill="#f97316" radius={[4,4,0,0]} />
            <Bar dataKey="avaliacoes" name="Avaliações" fill="#a855f7" radius={[4,4,0,0]} />
            <Bar dataKey="registros" name="Registros de carga" fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de engajamento */}
        <div className="card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4" style={{ color: '#f97316' }} />
            Ranking de engajamento
          </h2>

          {alunosEngajamento.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Nenhum aluno cadastrado ainda
            </div>
          ) : (
            <div className="space-y-4">
              {alunosEngajamento.slice(0, 8).map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : i === 1 ? 'text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
                    : i === 2 ? 'text-orange-800 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'text-muted-foreground bg-muted'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.nome}</p>
                    <ScoreBar value={a.score} />
                  </div>
                  <div className="text-right flex-shrink-0 text-xs text-muted-foreground space-y-0.5">
                    <p>{a.anamneses} anam.</p>
                    <p>{a.registrosCarga} reg.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evolução dos alunos */}
        <div className="card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: '#f97316' }} />
            Evolução corporal dos alunos
          </h2>

          {alunosEngajamento.filter(a => a.evolucaoPeso !== null).length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground text-center px-4">
              Nenhuma avaliação física com evolução registrada ainda
            </div>
          ) : (
            <div className="space-y-3">
              {alunosEngajamento
                .filter(a => a.evolucaoPeso !== null || a.evolucaoGordura !== null || a.evolucaoCargaMedia !== null)
                .slice(0, 6)
                .map(a => (
                  <div key={a.id} className="p-3 rounded-lg border border-border">
                    <p className="text-sm font-medium text-foreground mb-2">{a.nome}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Peso */}
                      <div className="text-center p-2 rounded-lg bg-muted/40">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          {a.evolucaoPeso === null ? <Minus className="h-3 w-3 text-muted-foreground" />
                            : a.evolucaoPeso < 0 ? <TrendingDown className="h-3 w-3 text-green-500" />
                            : <TrendingUp className="h-3 w-3 text-red-500" />}
                          <span className={`text-xs font-bold ${
                            a.evolucaoPeso === null ? 'text-muted-foreground'
                            : a.evolucaoPeso < 0 ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {a.evolucaoPeso === null ? '—' : `${a.evolucaoPeso > 0 ? '+' : ''}${a.evolucaoPeso?.toFixed(1)}kg`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Peso</p>
                      </div>
                      {/* Gordura */}
                      <div className="text-center p-2 rounded-lg bg-muted/40">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          {a.evolucaoGordura === null ? <Minus className="h-3 w-3 text-muted-foreground" />
                            : a.evolucaoGordura < 0 ? <TrendingDown className="h-3 w-3 text-green-500" />
                            : <TrendingUp className="h-3 w-3 text-red-500" />}
                          <span className={`text-xs font-bold ${
                            a.evolucaoGordura === null ? 'text-muted-foreground'
                            : a.evolucaoGordura < 0 ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {a.evolucaoGordura === null ? '—' : `${a.evolucaoGordura > 0 ? '+' : ''}${a.evolucaoGordura?.toFixed(1)}%`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Gordura</p>
                      </div>
                      {/* Carga */}
                      <div className="text-center p-2 rounded-lg bg-muted/40">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          {a.evolucaoCargaMedia === null ? <Minus className="h-3 w-3 text-muted-foreground" />
                            : a.evolucaoCargaMedia > 0 ? <TrendingUp className="h-3 w-3 text-green-500" />
                            : <TrendingDown className="h-3 w-3 text-red-500" />}
                          <span className={`text-xs font-bold ${
                            a.evolucaoCargaMedia === null ? 'text-muted-foreground'
                            : a.evolucaoCargaMedia > 0 ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {a.evolucaoCargaMedia === null ? '—' : `${a.evolucaoCargaMedia > 0 ? '+' : ''}${a.evolucaoCargaMedia?.toFixed(0)}%`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Força</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Radar do top aluno */}
      {topAluno && radarData.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Perfil completo — {topAluno.nome}
            <span className="text-xs font-normal text-muted-foreground">(aluno mais engajado)</span>
          </h2>
          <p className="text-xs text-muted-foreground mb-6">Score de engajamento em cada dimensão (0–100)</p>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={topAluno.nome} dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v}`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 w-full lg:w-64 flex-shrink-0">
              {[
                { label: 'Score total', value: `${topAluno.score}/100`, color: '#f97316' },
                { label: 'Anamneses', value: topAluno.anamneses, color: '#3b82f6' },
                { label: 'Treinos', value: topAluno.treinos, color: '#a855f7' },
                { label: 'Avaliações', value: topAluno.avaliacoes, color: '#22c55e' },
                { label: 'Reg. de carga', value: topAluno.registrosCarga, color: '#f59e0b' },
                { label: 'Evolução força', value: topAluno.evolucaoCargaMedia !== null ? `${topAluno.evolucaoCargaMedia > 0 ? '+' : ''}${topAluno.evolucaoCargaMedia.toFixed(0)}%` : '—', color: '#22c55e' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg bg-muted/40 text-center">
                  <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
