'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Save, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Exercicio {
  nome: string
  series: number
  reps: string
  carga?: string
  observacoes?: string
}

interface ProgressaoItem {
  id: string
  carga: number
  series: number
  reps: string
  observacoes: string
  data_registro: string
}

interface Props {
  exercicio: Exercicio
  treinoId: string
  userId: string
  index: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="card p-3 text-xs shadow-lg">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="font-semibold text-foreground">{payload[0].value} kg</p>
      </div>
    )
  }
  return null
}

export function ProgressaoExercicio({ exercicio, treinoId, userId, index }: Props) {
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [historico, setHistorico] = useState<ProgressaoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    carga: exercicio.carga?.replace(/[^0-9.]/g, '') ?? '',
    series: String(exercicio.series),
    reps: exercicio.reps,
    observacoes: exercicio.observacoes ?? '',
  })

  useEffect(() => {
    if (expanded) fetchHistorico()
  }, [expanded])

  async function fetchHistorico() {
    setLoading(true)
    const { data } = await supabase
      .from('progressao_exercicios')
      .select('*')
      .eq('user_id', userId)
      .eq('treino_id', treinoId)
      .eq('exercicio_nome', exercicio.nome)
      .order('data_registro', { ascending: true })
      .limit(20)
    setHistorico(data ?? [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.carga) return
    setSaving(true)
    await supabase.from('progressao_exercicios').insert({
      user_id: userId,
      treino_id: treinoId,
      exercicio_nome: exercicio.nome,
      carga: parseFloat(form.carga),
      series: parseInt(form.series),
      reps: form.reps,
      observacoes: form.observacoes,
      data_registro: new Date().toISOString().slice(0, 10),
    })
    setSaving(false)
    setSaved(true)
    fetchHistorico()
    setTimeout(() => setSaved(false), 2500)
  }

  // Calcula tendência
  const ultimaCarga = historico.length > 0 ? historico[historico.length - 1].carga : null
  const penultimaCarga = historico.length > 1 ? historico[historico.length - 2].carga : null
  const diff = ultimaCarga && penultimaCarga ? ultimaCarga - penultimaCarga : null

  const chartData = historico.map(h => ({
    data: format(new Date(h.data_registro), 'dd/MM', { locale: ptBR }),
    carga: Number(h.carga),
  }))

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header — sempre visível */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{background:'rgba(249,115,22,0.15)',color:'#ea580c'}}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{exercicio.nome}</p>
          <p className="text-xs text-muted-foreground">
            {exercicio.series} séries × {exercicio.reps} reps
            {exercicio.carga ? ` · ${exercicio.carga}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {diff !== null && (
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              diff > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : diff < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-muted text-muted-foreground'
            }`}>
              {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff} kg
            </span>
          )}
          {ultimaCarga && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              {ultimaCarga} kg
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-5 animate-slide-up">

          {/* Formulário de registro */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Registrar execução de hoje
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label text-xs">Carga (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.carga}
                  onChange={e => setForm(f => ({...f, carga: e.target.value}))}
                  placeholder="Ex: 60"
                  className="input-base"
                />
              </div>
              <div>
                <label className="form-label text-xs">Séries</label>
                <input
                  type="number"
                  value={form.series}
                  onChange={e => setForm(f => ({...f, series: e.target.value}))}
                  className="input-base"
                />
              </div>
              <div>
                <label className="form-label text-xs">Repetições</label>
                <input
                  type="text"
                  value={form.reps}
                  onChange={e => setForm(f => ({...f, reps: e.target.value}))}
                  placeholder="Ex: 10-12"
                  className="input-base"
                />
              </div>
              <div>
                <label className="form-label text-xs">Observações</label>
                <input
                  type="text"
                  value={form.observacoes}
                  onChange={e => setForm(f => ({...f, observacoes: e.target.value}))}
                  placeholder="Ex: Boa execução"
                  className="input-base"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !form.carga}
              className="btn-primary mt-3 text-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Salvo!' : 'Salvar execução'}
            </button>
          </div>

          {/* Gráfico */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Progressão de carga
            </p>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length < 2 ? (
              <div className="flex items-center justify-center h-24 rounded-lg bg-muted/30 border border-dashed border-border">
                <p className="text-xs text-muted-foreground text-center px-4">
                  Registre pelo menos 2 execuções para ver o gráfico de progressão
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="data"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false} tickLine={false} width={36}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {penultimaCarga && (
                    <ReferenceLine y={penultimaCarga} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                  )}
                  <Line
                    type="monotone"
                    dataKey="carga"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={{ fill: '#f97316', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#ea580c' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {/* Histórico em tabela */}
            {historico.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico</p>
                {[...historico].reverse().map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">
                      {format(new Date(h.data_registro), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                    <div className="flex gap-3">
                      <span className="text-muted-foreground">{h.series}×{h.reps}</span>
                      <span className="font-semibold text-foreground">{h.carga} kg</span>
                    </div>
                    {h.observacoes && (
                      <span className="text-muted-foreground italic truncate max-w-[100px]">{h.observacoes}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
