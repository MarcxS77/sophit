'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  userId: string
  treinoId: string
  treinoTitulo: string
  exercicios: { nome: string; series: number; reps: string; carga?: string }[]
}

export function ProgressaoAdmin({ userId, treinoId, treinoTitulo, exercicios }: Props) {
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dados, setDados] = useState<Record<string, any[]>>({})

  useEffect(() => {
    if (expanded) fetchDados()
  }, [expanded])

  async function fetchDados() {
    setLoading(true)
    const { data } = await supabase
      .from('progressao_exercicios')
      .select('*')
      .eq('user_id', userId)
      .eq('treino_id', treinoId)
      .order('data_registro', { ascending: true })

    const grouped: Record<string, any[]> = {}
    for (const row of data ?? []) {
      if (!grouped[row.exercicio_nome]) grouped[row.exercicio_nome] = []
      grouped[row.exercicio_nome].push(row)
    }
    setDados(grouped)
    setLoading(false)
  }

  const totalRegistros = Object.values(dados).reduce((acc, arr) => acc + arr.length, 0)

  return (
    <div className="border border-border rounded-xl overflow-hidden mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{color:'#f97316'}} />
          <span className="text-sm font-semibold text-foreground">Progressão de cargas — {treinoTitulo}</span>
          {totalRegistros > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              {totalRegistros} registros
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-6 animate-slide-up">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : totalRegistros === 0 ? (
            <div className="flex items-center justify-center h-20 rounded-lg bg-muted/30 border border-dashed border-border">
              <p className="text-sm text-muted-foreground">Nenhum registro de carga ainda para este treino</p>
            </div>
          ) : (
            exercicios.map((ex) => {
              const hist = dados[ex.nome] ?? []
              if (hist.length === 0) return null

              const ultima = hist[hist.length - 1]?.carga
              const penultima = hist.length > 1 ? hist[hist.length - 2]?.carga : null
              const diff = ultima && penultima ? Number(ultima) - Number(penultima) : null

              const chartData = hist.map(h => ({
                data: format(new Date(h.data_registro), 'dd/MM', { locale: ptBR }),
                carga: Number(h.carga),
              }))

              return (
                <div key={ex.nome}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">{ex.nome}</p>
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
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                        {ultima} kg atual
                      </span>
                    </div>
                  </div>

                  {chartData.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={32} />
                        <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${v} kg`, 'Carga']} />
                        <Line type="monotone" dataKey="carga" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} activeDot={{ r: 5 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
                      Apenas 1 registro — precisa de mais execuções para mostrar o gráfico
                    </div>
                  )}

                  {/* Tabela de histórico */}
                  <div className="mt-2 space-y-1">
                    {[...hist].reverse().slice(0, 5).map((h: any) => (
                      <div key={h.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">
                          {format(new Date(h.data_registro), "dd/MM/yyyy")}
                        </span>
                        <span className="text-muted-foreground">{h.series}×{h.reps}</span>
                        <span className="font-semibold text-foreground">{h.carga} kg</span>
                        {h.observacoes && <span className="text-muted-foreground italic truncate max-w-[120px]">{h.observacoes}</span>}
                      </div>
                    ))}
                  </div>
                  <div className="border-b border-border mt-4 last:hidden" />
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
