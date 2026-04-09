'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { avaliacaoSchema, type AvaliacaoFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Scale, Calculator, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface AvaliacaoFormProps {
  userId: string
  userName: string
}

function calcIMC(peso: number, altura: number): number {
  return peso / Math.pow(altura / 100, 2)
}

function imcCategory(imc: number): { label: string; color: string } {
  if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' }
  if (imc < 25) return { label: 'Peso normal', color: 'text-brand-600' }
  if (imc < 30) return { label: 'Sobrepeso', color: 'text-amber-500' }
  if (imc < 35) return { label: 'Obesidade grau I', color: 'text-orange-500' }
  if (imc < 40) return { label: 'Obesidade grau II', color: 'text-red-500' }
  return { label: 'Obesidade grau III', color: 'text-red-700' }
}

export function AvaliacaoForm({ userId, userName }: AvaliacaoFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AvaliacaoFormData>({
    resolver: zodResolver(avaliacaoSchema),
  })

  const peso = watch('peso')
  const altura = watch('altura')
  const imc = peso && altura && peso > 0 && altura > 0 ? calcIMC(Number(peso), Number(altura)) : null
  const imcCat = imc ? imcCategory(imc) : null

  async function onSubmit(data: AvaliacaoFormData) {
    setLoading(true)
    const massaMagra = data.massa_magra
      ?? (data.peso && data.percentual_gordura
          ? data.peso * (1 - data.percentual_gordura / 100)
          : undefined)

    const { error } = await supabase.from('avaliacoes_fisicas').insert({
      user_id: userId,
      peso: data.peso,
      altura: data.altura,
      medidas: data.medidas,
      dobras_cutaneas: data.dobras_cutaneas,
      percentual_gordura: data.percentual_gordura,
      massa_magra: massaMagra,
    })

    setLoading(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* IMC Preview */}
      {imc && imcCat && (
        <div className="card p-4 flex items-center gap-4 animate-slide-up">
          <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20">
            <Calculator className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">IMC calculado automaticamente</p>
            <p className="text-2xl font-bold text-foreground">{imc.toFixed(1)}</p>
          </div>
          <span className={`badge text-sm font-semibold ${imcCat.color} bg-transparent border border-current`}>
            {imcCat.label}
          </span>
        </div>
      )}

      {/* Dados Principais */}
      <div className="card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Scale className="h-4 w-4 text-brand-600" />
          Composição Corporal — {userName}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Peso (kg)</label>
            <input
              {...register('peso', { valueAsNumber: true })}
              type="number"
              step="0.1"
              placeholder="75.5"
              className="input-base"
            />
            {errors.peso && <p className="form-error">{errors.peso.message}</p>}
          </div>
          <div>
            <label className="form-label">Altura (cm)</label>
            <input
              {...register('altura', { valueAsNumber: true })}
              type="number"
              step="0.1"
              placeholder="175"
              className="input-base"
            />
            {errors.altura && <p className="form-error">{errors.altura.message}</p>}
          </div>
          <div>
            <label className="form-label">% de Gordura</label>
            <input
              {...register('percentual_gordura', { valueAsNumber: true })}
              type="number"
              step="0.1"
              placeholder="18.5"
              className="input-base"
            />
          </div>
          <div>
            <label className="form-label">Massa Magra (kg)</label>
            <input
              {...register('massa_magra', { valueAsNumber: true })}
              type="number"
              step="0.1"
              placeholder="Auto-calculado"
              className="input-base"
            />
          </div>
        </div>
      </div>

      {/* Medidas */}
      <div className="card p-6">
        <h3 className="font-semibold text-foreground mb-4">Medidas (cm)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: 'braco_d', label: 'Braço D.' },
            { key: 'braco_e', label: 'Braço E.' },
            { key: 'cintura', label: 'Cintura' },
            { key: 'quadril', label: 'Quadril' },
            { key: 'coxa_d', label: 'Coxa D.' },
            { key: 'coxa_e', label: 'Coxa E.' },
            { key: 'peitoral', label: 'Peitoral' },
            { key: 'panturrilha', label: 'Panturrilha' },
          ].map(m => (
            <div key={m.key}>
              <label className="form-label text-xs">{m.label}</label>
              <input
                {...register(`medidas.${m.key}` as any, { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="—"
                className="input-base"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dobras Cutâneas */}
      <div className="card p-6">
        <h3 className="font-semibold text-foreground mb-4">Dobras Cutâneas (mm)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { key: 'tricipital', label: 'Tricipital' },
            { key: 'subescapular', label: 'Subescapular' },
            { key: 'suprailíaca', label: 'Suprailíaca' },
            { key: 'abdominal', label: 'Abdominal' },
            { key: 'coxa', label: 'Coxa' },
            { key: 'peitoral', label: 'Peitoral' },
          ].map(d => (
            <div key={d.key}>
              <label className="form-label text-xs">{d.label}</label>
              <input
                {...register(`dobras_cutaneas.${d.key}` as any, { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="—"
                className="input-base"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar Avaliação
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-brand-600">
            <CheckCircle2 className="h-4 w-4" />
            Avaliação salva!
          </span>
        )}
      </div>
    </form>
  )
}
