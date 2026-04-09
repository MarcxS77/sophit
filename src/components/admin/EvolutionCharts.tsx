'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AvaliacaoFisica } from '@/types'

interface EvolutionChartsProps {
  avaliacoes: AvaliacaoFisica[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {entry.value}
            {entry.name === 'Peso' ? 'kg' : '%'}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function EvolutionCharts({ avaliacoes }: EvolutionChartsProps) {
  const data = avaliacoes.map(a => ({
    date: format(new Date(a.created_at), 'dd/MM', { locale: ptBR }),
    Peso: a.peso ?? null,
    Gordura: a.percentual_gordura ?? null,
    'Massa Magra': a.massa_magra ?? null,
  }))

  return (
    <div className="space-y-8">
      {/* Peso */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Evolução do Peso (kg)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="Peso"
              stroke="#0d9178"
              strokeWidth={2.5}
              dot={{ fill: '#0d9178', r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Composição Corporal */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Composição Corporal (%)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="Gordura"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="Massa Magra"
              stroke="#3b82f6"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
