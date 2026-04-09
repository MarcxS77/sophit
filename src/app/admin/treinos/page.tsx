'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { treinoSchema, type TreinoFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  Trash2,
  Dumbbell,
  Loader2,
  CheckCircle2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Profile } from '@/types'

export default function GestorTreinosPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedEx, setExpandedEx] = useState<number | null>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'user')
      .order('full_name')
      .then(({ data }) => setUsers(data ?? []))
  }, [])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TreinoFormData>({
    resolver: zodResolver(treinoSchema),
    defaultValues: {
      lista_exercicios: [{ nome: '', series: 3, reps: '10-12', carga: '', observacoes: '' }],
      data_atribuicao: new Date().toISOString().slice(0, 10),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lista_exercicios',
  })

  async function onSubmit(data: TreinoFormData) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('treinos').insert({
      ...data,
      admin_id: user!.id,
    })

    setLoading(false)
    if (!error) {
      setSaved(true)
      reset()
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-brand-600" />
          Gestor de Treinos
        </h1>
        <p className="text-muted-foreground mt-1">Crie e atribua treinos personalizados</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações básicas */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Informações do Treino</h2>

          <div>
            <label className="form-label">Atribuir para</label>
            <select {...register('user_id')} className="input-base">
              <option value="">Selecione um aluno...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name ?? u.email}
                </option>
              ))}
            </select>
            {errors.user_id && <p className="form-error">{errors.user_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Título do Treino</label>
              <input
                {...register('titulo')}
                placeholder="Ex: Treino A — Peito e Tríceps"
                className="input-base"
              />
              {errors.titulo && <p className="form-error">{errors.titulo.message}</p>}
            </div>
            <div>
              <label className="form-label">Data de atribuição</label>
              <input
                {...register('data_atribuicao')}
                type="date"
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Descrição (opcional)</label>
            <textarea
              {...register('descricao')}
              rows={2}
              placeholder="Instruções gerais, foco do treino..."
              className="input-base resize-none"
            />
          </div>
        </div>

        {/* Exercícios */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Exercícios
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({fields.length})
              </span>
            </h2>
            <button
              type="button"
              onClick={() => append({ nome: '', series: 3, reps: '10-12', carga: '', observacoes: '' })}
              className="btn-secondary text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar exercício
            </button>
          </div>

          {errors.lista_exercicios?.root && (
            <p className="form-error mb-3">{errors.lista_exercicios.root.message}</p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-border rounded-lg overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center gap-3 p-3 bg-muted/30 cursor-pointer"
                  onClick={() => setExpandedEx(expandedEx === index ? null : index)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {field.nome || `Exercício ${index + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); remove(index) }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {expandedEx === index
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>

                {/* Body */}
                {expandedEx === index && (
                  <div className="p-4 grid grid-cols-2 gap-3 animate-slide-up">
                    <div className="col-span-2">
                      <label className="form-label text-xs">Nome do exercício</label>
                      <input
                        {...register(`lista_exercicios.${index}.nome`)}
                        placeholder="Ex: Supino reto com barra"
                        className="input-base"
                      />
                      {errors.lista_exercicios?.[index]?.nome && (
                        <p className="form-error">{errors.lista_exercicios[index]?.nome?.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="form-label text-xs">Séries</label>
                      <input
                        {...register(`lista_exercicios.${index}.series`, { valueAsNumber: true })}
                        type="number"
                        min={1}
                        max={20}
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs">Repetições</label>
                      <input
                        {...register(`lista_exercicios.${index}.reps`)}
                        placeholder="Ex: 10-12 ou 15"
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs">Carga sugerida</label>
                      <input
                        {...register(`lista_exercicios.${index}.carga`)}
                        placeholder="Ex: 60kg ou 40%"
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs">Observações</label>
                      <input
                        {...register(`lista_exercicios.${index}.observacoes`)}
                        placeholder="Pausa, técnica especial..."
                        className="input-base"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar e Atribuir Treino
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-brand-600">
              <CheckCircle2 className="h-4 w-4" />
              Treino criado com sucesso!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
