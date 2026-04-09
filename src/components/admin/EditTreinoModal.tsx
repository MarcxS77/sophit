'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { treinoSchema, type TreinoFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, Save
} from 'lucide-react'

interface Exercicio {
  nome: string
  series: number
  reps: string
  carga?: string
  observacoes?: string
}

interface Treino {
  id: string
  titulo: string
  descricao: string | null
  lista_exercicios: Exercicio[]
  data_atribuicao: string
  ativo: boolean
  user_id: string
}

interface Props {
  treino: Treino
  onClose: () => void
}

export function EditTreinoModal({ treino, onClose }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedEx, setExpandedEx] = useState<number | null>(0)

  const { register, handleSubmit, control, formState: { errors } } = useForm<TreinoFormData>({
    resolver: zodResolver(treinoSchema),
    defaultValues: {
      user_id: treino.user_id,
      titulo: treino.titulo,
      descricao: treino.descricao ?? '',
      lista_exercicios: treino.lista_exercicios.length > 0
        ? treino.lista_exercicios
        : [{ nome: '', series: 3, reps: '10-12', carga: '', observacoes: '' }],
      data_atribuicao: treino.data_atribuicao,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lista_exercicios' })

  async function onSubmit(data: TreinoFormData) {
    setLoading(true)
    const { error } = await supabase
      .from('treinos')
      .update({
        titulo: data.titulo,
        descricao: data.descricao,
        lista_exercicios: data.lista_exercicios,
        data_atribuicao: data.data_atribuicao,
      })
      .eq('id', treino.id)

    setLoading(false)
    if (!error) {
      setSaved(true)
      router.refresh()
      setTimeout(() => { setSaved(false); onClose() }, 1500)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-2xl my-4 shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-foreground text-lg">Editar Treino</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* Info básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="form-label">Título do treino</label>
                <input {...register('titulo')} className="input-base" placeholder="Ex: Treino A — Peito" />
                {errors.titulo && <p className="form-error">{errors.titulo.message}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="form-label">Data de atribuição</label>
                <input {...register('data_atribuicao')} type="date" className="input-base" />
              </div>
            </div>

            <div>
              <label className="form-label">Descrição <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <textarea {...register('descricao')} rows={2} className="input-base resize-none" placeholder="Orientações gerais do treino..." />
            </div>

            {/* Exercícios */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="form-label !mb-0">
                  Exercícios
                  <span className="ml-2 text-xs font-normal text-muted-foreground">({fields.length})</span>
                </label>
                <button
                  type="button"
                  onClick={() => { append({ nome: '', series: 3, reps: '10-12', carga: '', observacoes: '' }); setExpandedEx(fields.length) }}
                  className="btn-secondary text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </button>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="border border-border rounded-lg overflow-hidden">
                    {/* Row header */}
                    <div
                      className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer"
                      onClick={() => setExpandedEx(expandedEx === index ? null : index)}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(249,115,22,0.15)', color: '#ea580c' }}>
                        {index + 1}
                      </div>
                      <span className="flex-1 text-sm font-medium text-foreground truncate">
                        {field.nome || `Exercício ${index + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); remove(index) }}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {expandedEx === index
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>

                    {/* Expanded fields */}
                    {expandedEx === index && (
                      <div className="p-4 grid grid-cols-2 gap-3 animate-slide-up">
                        <div className="col-span-2">
                          <label className="form-label text-xs">Nome do exercício</label>
                          <input {...register(`lista_exercicios.${index}.nome`)}
                            placeholder="Ex: Supino reto com barra" className="input-base" />
                          {errors.lista_exercicios?.[index]?.nome && (
                            <p className="form-error">{errors.lista_exercicios[index]?.nome?.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="form-label text-xs">Séries</label>
                          <input {...register(`lista_exercicios.${index}.series`, { valueAsNumber: true })}
                            type="number" min={1} max={20} className="input-base" />
                        </div>
                        <div>
                          <label className="form-label text-xs">Repetições</label>
                          <input {...register(`lista_exercicios.${index}.reps`)}
                            placeholder="Ex: 10-12" className="input-base" />
                        </div>
                        <div>
                          <label className="form-label text-xs">Carga sugerida</label>
                          <input {...register(`lista_exercicios.${index}.carga`)}
                            placeholder="Ex: 60kg" className="input-base" />
                        </div>
                        <div>
                          <label className="form-label text-xs">Observações</label>
                          <input {...register(`lista_exercicios.${index}.observacoes`)}
                            placeholder="Ex: Pausa 90s" className="input-base" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-5 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary gap-2">
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : saved
                ? <CheckCircle2 className="h-4 w-4" />
                : <Save className="h-4 w-4" />}
              {saved ? 'Salvo!' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
