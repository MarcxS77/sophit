'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { treinoSchema, type TreinoFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, Dumbbell, Loader2, CheckCircle2,
  GripVertical, ChevronDown, ChevronUp, BookOpen,
  Copy, Save, ChevronRight,
} from 'lucide-react'
import type { Profile } from '@/types'

interface Template {
  id: string
  titulo: string
  descricao: string | null
  lista_exercicios: any[]
  categoria: string | null
}

export default function GestorTreinosPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedEx, setExpandedEx] = useState<number | null>(null)
  const [saveAsTemplate, setSaveAsTemplate] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateCategoria, setTemplateCategoria] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'user').order('full_name')
      .then(({ data }) => setUsers(data ?? []))
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    const { data } = await supabase
      .from('treino_templates')
      .select('*')
      .order('created_at', { ascending: false })
    setTemplates(data ?? [])
  }

  const { register, handleSubmit, control, reset, setValue, getValues, formState: { errors } } = useForm<TreinoFormData>({
    resolver: zodResolver(treinoSchema),
    defaultValues: {
      lista_exercicios: [{ nome: '', series: 3, reps: '10-12', carga: '', observacoes: '' }],
      data_atribuicao: new Date().toISOString().slice(0, 10),
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lista_exercicios' })

  function loadTemplate(template: Template) {
    setValue('titulo', template.titulo)
    setValue('descricao', template.descricao ?? '')
    setValue('lista_exercicios', template.lista_exercicios)
    setShowTemplates(false)
    setExpandedEx(null)
  }

  async function deleteTemplate(id: string) {
    await supabase.from('treino_templates').delete().eq('id', id)
    fetchTemplates()
  }

  async function onSubmit(data: TreinoFormData) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Salva o treino
    const { error } = await supabase.from('treinos').insert({
      ...data,
      admin_id: user!.id,
    })

    // Salva como template se marcado
    if (!error && saveAsTemplate) {
      await supabase.from('treino_templates').insert({
        admin_id: user!.id,
        titulo: data.titulo,
        descricao: data.descricao,
        lista_exercicios: data.lista_exercicios,
        categoria: templateCategoria || null,
      })
      fetchTemplates()
    }

    setLoading(false)
    if (!error) {
      setSaved(true)
      reset({
        lista_exercicios: [{ nome: '', series: 3, reps: '10-12', carga: '', observacoes: '' }],
        data_atribuicao: new Date().toISOString().slice(0, 10),
      })
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Dumbbell className="h-6 w-6" style={{ color: '#f97316' }} />
          Gestor de Treinos
        </h1>
        <p className="text-muted-foreground mt-1">Crie, reutilize e atribua treinos personalizados</p>
      </div>

      {/* Biblioteca de Templates */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" style={{ color: '#f97316' }} />
            <span className="font-semibold text-foreground">Biblioteca de Treinos</span>
            {templates.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 font-medium">
                {templates.length} salvos
              </span>
            )}
          </div>
          {showTemplates
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showTemplates && (
          <div className="border-t border-border p-4 animate-slide-up">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum template salvo ainda. Crie um treino marcando "Salvar na biblioteca".
              </p>
            ) : (
              <div className="space-y-3">
                {templates.map(t => (
                  <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-foreground">{t.titulo}</p>
                        {t.categoria && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t.categoria}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.lista_exercicios.length} exercícios
                        {t.descricao && ` · ${t.descricao}`}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => loadTemplate(t)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Usar
                      </button>
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Informações do Treino</h2>

          <div>
            <label className="form-label">Atribuir para</label>
            <select {...register('user_id')} className="input-base">
              <option value="">Selecione um aluno...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>
              ))}
            </select>
            {errors.user_id && <p className="form-error">{errors.user_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Título do Treino</label>
              <input {...register('titulo')} placeholder="Ex: Treino A — Peito e Tríceps" className="input-base" />
              {errors.titulo && <p className="form-error">{errors.titulo.message}</p>}
            </div>
            <div>
              <label className="form-label">Data de atribuição</label>
              <input {...register('data_atribuicao')} type="date" className="input-base" />
            </div>
          </div>

          <div>
            <label className="form-label">Descrição <span className="text-muted-foreground font-normal text-xs">(opcional)</span></label>
            <textarea {...register('descricao')} rows={2} placeholder="Instruções gerais, foco do treino..." className="input-base resize-none" />
          </div>

          {/* Opção de salvar como template */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setSaveAsTemplate(!saveAsTemplate)}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${saveAsTemplate ? 'bg-orange-500' : 'bg-muted-foreground/30'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${saveAsTemplate ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Salvar na biblioteca</p>
                <p className="text-xs text-muted-foreground">Permite reutilizar este treino para outros alunos</p>
              </div>
            </label>
            {saveAsTemplate && (
              <div className="mt-3">
                <label className="form-label text-xs">Categoria <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <input
                  value={templateCategoria}
                  onChange={e => setTemplateCategoria(e.target.value)}
                  placeholder="Ex: Hipertrofia, Emagrecimento, Funcional..."
                  className="input-base"
                />
              </div>
            )}
          </div>
        </div>

        {/* Exercícios */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Exercícios
              <span className="ml-2 text-xs font-normal text-muted-foreground">({fields.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => { append({ nome: '', series: 3, reps: '10-12', carga: '', observacoes: '' }); setExpandedEx(fields.length) }}
              className="btn-secondary text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar exercício
            </button>
          </div>

          {errors.lista_exercicios?.root && (
            <p className="form-error mb-3">{errors.lista_exercicios.root.message}</p>
          )}

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-border rounded-lg overflow-hidden">
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
                  <button type="button" onClick={(e) => { e.stopPropagation(); remove(index) }}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {expandedEx === index
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>

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
                        placeholder="Pausa, técnica especial..." className="input-base" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary gap-2">
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : saved
              ? <CheckCircle2 className="h-4 w-4" />
              : <Save className="h-4 w-4" />}
            {saved ? 'Treino criado!' : 'Criar e Atribuir Treino'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {saveAsTemplate ? 'Salvo na biblioteca!' : ''}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
