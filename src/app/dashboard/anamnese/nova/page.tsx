'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { anamneseSchema, type AnamneseFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Steps ───────────────────────────────────────────────────
const STEPS = [
  { label: 'Identificação' },
  { label: 'Objetivos' },
  { label: 'Histórico Físico' },
  { label: 'Saúde' },
  { label: 'Dores & Limitações' },
  { label: 'Revisão' },
]

// ─── Helper components ───────────────────────────────────────
function CheckboxGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt])
  }
  return (
    <div>
      <p className="form-label">{label}</p>
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm border transition-all',
              value.includes(o.value)
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-border text-muted-foreground hover:border-brand-400 hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <div>
      <p className="form-label">{label}</p>
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm border transition-all',
              value === o.value
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-border text-muted-foreground hover:border-brand-400 hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

function SimNao({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: string
  onChange: (v: 'sim' | 'nao') => void
  error?: string
}) {
  return (
    <RadioGroup
      label={label}
      options={[{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }]}
      value={value}
      onChange={(v) => onChange(v as 'sim' | 'nao')}
      error={error}
    />
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function NovaAnamnesePage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<AnamneseFormData>({
    resolver: zodResolver(anamneseSchema),
    defaultValues: {
      objetivos: [],
      tipos_exercicio: [],
      nao_gosta: 'nao',
      praticou_exercicio: 'nao',
      tem_doenca: 'nao',
      fez_cirurgia: 'nao',
      tem_dor: 'nao',
      dor_peito_exercicio: 'nao',
      tontura_desmaio: 'nao',
      desconforto_atividades: 'nao',
      historico_cardiaco_familiar: 'nao',
      teve_lesao: 'nao',
      tem_limitacao: 'nao',
      dor_regioes: [{ regiao: '', nota: 0, dificuldade: '' }],
    },
  })

  const { fields: dorFields, append: appendDor, remove: removeDor } = useFieldArray({
    control,
    name: 'dor_regioes',
  })

  const w = watch()

  // Fields to validate per step
  const stepFields: Record<number, (keyof AnamneseFormData)[]> = {
    0: ['nome', 'idade', 'sexo'],
    1: ['objetivos', 'disponibilidade_dias', 'disponibilidade_minutos', 'tipos_exercicio'],
    2: ['praticou_exercicio'],
    3: ['tem_doenca', 'fez_cirurgia'],
    4: ['tem_dor', 'dor_peito_exercicio', 'tontura_desmaio', 'desconforto_atividades', 'historico_cardiaco_familiar', 'teve_lesao', 'tem_limitacao'],
    5: [],
  }

  async function nextStep() {
    const fields = stepFields[step]
    if (fields.length > 0) {
      const valid = await trigger(fields)
      if (!valid) return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0 })
  }

  async function onSubmit(data: AnamneseFormData) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error } = await supabase.from('anamneses').insert({
      user_id: user.id,
      data,
      status: 'pendente',
    })

    setLoading(false)
    if (!error) {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard/anamnese'), 2500)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="inline-flex p-5 rounded-full bg-brand-50 dark:bg-brand-900/20 mb-5">
          <CheckCircle2 className="h-10 w-10 text-brand-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Anamnese enviada!</h2>
        <p className="text-muted-foreground">
          Seu profissional irá analisar e responder em breve.
        </p>
      </div>
    )
  }

  const vals = getValues()

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Anamnese</h1>
        <p className="text-muted-foreground mt-1">
          Preencha com atenção para receber um acompanhamento personalizado
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-1 flex-1 min-w-0">
            <div className={cn(
              'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-all',
              i < step ? 'bg-brand-600 text-white'
                : i === step ? 'bg-brand-600 text-white ring-2 ring-brand-200 dark:ring-brand-800'
                : 'bg-muted text-muted-foreground'
            )}>
              {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn(
              'text-xs font-medium hidden md:block whitespace-nowrap',
              i === step ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 rounded-full min-w-[8px]',
                i < step ? 'bg-brand-600' : 'bg-muted'
              )} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-6 space-y-6 animate-slide-up">

          {/* ── STEP 0: Identificação ─────────────────── */}
          {step === 0 && (
            <>
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
                Identificação
              </p>

              <div>
                <label className="form-label">Nome completo</label>
                <input
                  {...register('nome')}
                  placeholder="Seu nome completo"
                  className="input-base"
                />
                {errors.nome && <p className="form-error">{errors.nome.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Idade</label>
                  <input
                    {...register('idade')}
                    placeholder="Ex: 32"
                    type="number"
                    className="input-base"
                  />
                  {errors.idade && <p className="form-error">{errors.idade.message}</p>}
                </div>
                <div>
                  <RadioGroup
                    label="Sexo"
                    options={[
                      { value: 'masculino', label: 'Masculino' },
                      { value: 'feminino', label: 'Feminino' },
                      { value: 'outro', label: 'Outro' },
                    ]}
                    value={w.sexo ?? ''}
                    onChange={(v) => setValue('sexo', v as any)}
                    error={errors.sexo?.message}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 1: Objetivos ─────────────────────── */}
          {step === 1 && (
            <>
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
                Objetivos e Preferências
              </p>

              <div>
                <CheckboxGroup
                  label="Quais são os seus objetivos com a prática de exercício físico?"
                  options={[
                    { value: 'prevencao', label: 'Prevenção' },
                    { value: 'condicionamento', label: 'Condicionamento físico' },
                    { value: 'lazer', label: 'Lazer' },
                    { value: 'estetica', label: 'Estética' },
                    { value: 'outros', label: 'Outros' },
                  ]}
                  value={w.objetivos ?? []}
                  onChange={(v) => setValue('objetivos', v)}
                />
                {errors.objetivos && <p className="form-error">{errors.objetivos.message}</p>}
                {w.objetivos?.includes('outros') && (
                  <input
                    {...register('objetivos_outros')}
                    placeholder="Descreva outros objetivos..."
                    className="input-base mt-2"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Dias da semana disponíveis para treino</label>
                  <input
                    {...register('disponibilidade_dias')}
                    placeholder="Ex: Segunda, quarta e sexta"
                    className="input-base"
                  />
                  {errors.disponibilidade_dias && (
                    <p className="form-error">{errors.disponibilidade_dias.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Minutos disponíveis por dia</label>
                  <input
                    {...register('disponibilidade_minutos')}
                    placeholder="Ex: 60"
                    type="number"
                    className="input-base"
                  />
                  {errors.disponibilidade_minutos && (
                    <p className="form-error">{errors.disponibilidade_minutos.message}</p>
                  )}
                </div>
              </div>

              <div>
                <CheckboxGroup
                  label="Quais tipos de exercício você gosta?"
                  options={[
                    { value: 'musculacao', label: 'Musculação' },
                    { value: 'natacao', label: 'Natação' },
                    { value: 'peso_corporal', label: 'Peso do corpo' },
                    { value: 'esteira', label: 'Esteira' },
                    { value: 'bike', label: 'Bike' },
                    { value: 'lutas', label: 'Lutas' },
                    { value: 'outros', label: 'Outros' },
                  ]}
                  value={w.tipos_exercicio ?? []}
                  onChange={(v) => setValue('tipos_exercicio', v)}
                />
                {errors.tipos_exercicio && (
                  <p className="form-error">{errors.tipos_exercicio.message}</p>
                )}
                {w.tipos_exercicio?.includes('outros') && (
                  <input
                    {...register('tipos_exercicio_outros')}
                    placeholder="Quais outros exercícios você gosta?"
                    className="input-base mt-2"
                  />
                )}
              </div>

              <div>
                <SimNao
                  label="Existe alguma coisa que você NÃO GOSTA de fazer durante o exercício?"
                  value={w.nao_gosta ?? 'nao'}
                  onChange={(v) => setValue('nao_gosta', v)}
                />
                {w.nao_gosta === 'sim' && (
                  <textarea
                    {...register('nao_gosta_descricao')}
                    rows={2}
                    placeholder="Por favor, informe o que você não gosta..."
                    className="input-base resize-none mt-2"
                  />
                )}
              </div>
            </>
          )}

          {/* ── STEP 2: Histórico físico ──────────────── */}
          {step === 2 && (
            <>
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
                Histórico de Atividade Física
              </p>

              <div>
                <SimNao
                  label="Nos últimos três meses, você estava praticando algum tipo de exercício físico?"
                  value={w.praticou_exercicio ?? 'nao'}
                  onChange={(v) => setValue('praticou_exercicio', v)}
                />
              </div>

              {w.praticou_exercicio === 'sim' && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/40 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Detalhes do exercício praticado
                  </p>

                  <div>
                    <label className="form-label">Qual tipo de exercício estava praticando?</label>
                    <input
                      {...register('exercicio_tipo')}
                      placeholder="Ex: Musculação, corrida, natação..."
                      className="input-base"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Vezes por semana</label>
                      <input
                        {...register('exercicio_vezes_semana')}
                        type="number"
                        placeholder="Ex: 3"
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="form-label">Minutos por dia</label>
                      <input
                        {...register('exercicio_minutos_dia')}
                        type="number"
                        placeholder="Ex: 60"
                        className="input-base"
                      />
                    </div>
                  </div>

                  <RadioGroup
                    label="Qual era a intensidade?"
                    options={[
                      { value: 'leve', label: 'Leve' },
                      { value: 'moderada', label: 'Moderada' },
                      { value: 'vigorosa', label: 'Vigorosa' },
                    ]}
                    value={w.exercicio_intensidade ?? ''}
                    onChange={(v) => setValue('exercicio_intensidade', v as any)}
                  />
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: Saúde ─────────────────────────── */}
          {step === 3 && (
            <>
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
                Histórico de Saúde
              </p>

              <div>
                <SimNao
                  label="Você apresenta alguma doença diagnosticada pelo médico?"
                  value={w.tem_doenca ?? 'nao'}
                  onChange={(v) => setValue('tem_doenca', v)}
                />
                {w.tem_doenca === 'sim' && (
                  <textarea
                    {...register('doencas')}
                    rows={2}
                    placeholder="Informe as doenças diagnosticadas..."
                    className="input-base resize-none mt-2"
                  />
                )}
              </div>

              <div>
                <label className="form-label">
                  Informe o nome dos remédios que faz uso contínuo
                  <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
                </label>
                <textarea
                  {...register('medicamentos')}
                  rows={2}
                  placeholder="Ex: Losartana 50mg, Metformina 500mg... (deixe vazio se nenhum)"
                  className="input-base resize-none"
                />
              </div>

              <div>
                <SimNao
                  label="Você fez alguma cirurgia?"
                  value={w.fez_cirurgia ?? 'nao'}
                  onChange={(v) => setValue('fez_cirurgia', v)}
                />
                {w.fez_cirurgia === 'sim' && (
                  <textarea
                    {...register('cirurgia_regioes')}
                    rows={2}
                    placeholder="Indique a região do corpo onde foi realizada a cirurgia..."
                    className="input-base resize-none mt-2"
                  />
                )}
              </div>
            </>
          )}

          {/* ── STEP 4: Dores & Limitações ────────────── */}
          {step === 4 && (
            <>
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
                Dores, Desconfortos e Limitações
              </p>

              {/* Dores musculares */}
              <div>
                <SimNao
                  label="Atualmente você sente algum tipo de dor ou desconforto muscular?"
                  value={w.tem_dor ?? 'nao'}
                  onChange={(v) => setValue('tem_dor', v)}
                />

                {w.tem_dor === 'sim' && (
                  <div className="mt-3 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Para cada região com dor, use a escala abaixo (0 = sem dor → 10 = dor insuportável):
                    </p>

                    {/* Escala visual */}
                    <div className="flex items-center gap-1 p-3 rounded-lg bg-muted/40">
                      {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <div key={n} className="flex-1 text-center">
                          <div className={cn(
                            'w-full aspect-square rounded-full flex items-center justify-center text-xs font-bold mx-auto max-w-[24px]',
                            n === 0 ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                              : n <= 3 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : n <= 6 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          )}>
                            {n}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span>Sem dor</span>
                      <span>Dor insuportável</span>
                    </div>

                    {dorFields.map((field, idx) => (
                      <div key={field.id} className="p-4 rounded-lg border border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Região {idx + 1}
                          </p>
                          {dorFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDor(idx)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="form-label text-xs">Qual região?</label>
                          <input
                            {...register(`dor_regioes.${idx}.regiao`)}
                            placeholder="Ex: Lombar, joelho direito, ombro..."
                            className="input-base"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="form-label text-xs">Nota de dor (0–10)</label>
                            <input
                              {...register(`dor_regioes.${idx}.nota`, { valueAsNumber: true })}
                              type="number"
                              min={0}
                              max={10}
                              placeholder="0"
                              className="input-base"
                            />
                          </div>
                          <div>
                            <label className="form-label text-xs">Dificuldade no dia a dia</label>
                            <input
                              {...register(`dor_regioes.${idx}.dificuldade`)}
                              placeholder="Ex: Difícil subir escadas..."
                              className="input-base"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => appendDor({ regiao: '', nota: 0, dificuldade: '' })}
                      className="btn-secondary text-xs gap-1.5 w-full"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar outra região
                    </button>
                  </div>
                )}
              </div>

              {/* Dor no peito */}
              <SimNao
                label="Você sente dor no peito quando realiza exercício físico?"
                value={w.dor_peito_exercicio ?? 'nao'}
                onChange={(v) => setValue('dor_peito_exercicio', v)}
              />

              {/* Tontura/desmaio */}
              <SimNao
                label="Você perdeu o equilíbrio por causa de tontura ou alguma vez perdeu a consciência?"
                value={w.tontura_desmaio ?? 'nao'}
                onChange={(v) => setValue('tontura_desmaio', v)}
              />

              {/* Desconforto em atividades diárias */}
              <div>
                <SimNao
                  label="Você sente algum desconforto ao realizar atividades do dia a dia (caminhar, subir escadas, trabalho)?"
                  value={w.desconforto_atividades ?? 'nao'}
                  onChange={(v) => setValue('desconforto_atividades', v)}
                />
                {w.desconforto_atividades === 'sim' && (
                  <textarea
                    {...register('desconforto_descricao')}
                    rows={2}
                    placeholder="Descreva as atividades e a dificuldade que sente..."
                    className="input-base resize-none mt-2"
                  />
                )}
              </div>

              {/* Histórico familiar */}
              <SimNao
                label="Algum parente de primeiro grau tem problemas cardíacos?"
                value={w.historico_cardiaco_familiar ?? 'nao'}
                onChange={(v) => setValue('historico_cardiaco_familiar', v)}
              />

              {/* Lesões */}
              <div>
                <SimNao
                  label="Você já teve alguma lesão muscular ou articular?"
                  value={w.teve_lesao ?? 'nao'}
                  onChange={(v) => setValue('teve_lesao', v)}
                />
                {w.teve_lesao === 'sim' && (
                  <textarea
                    {...register('lesao_descricao')}
                    rows={2}
                    placeholder="Que tipo de lesão e em qual local?"
                    className="input-base resize-none mt-2"
                  />
                )}
              </div>

              {/* Limitações de movimento */}
              <div>
                <SimNao
                  label="Atualmente você tem alguma limitação ou dificuldade de movimentos?"
                  value={w.tem_limitacao ?? 'nao'}
                  onChange={(v) => setValue('tem_limitacao', v)}
                />
                {w.tem_limitacao === 'sim' && (
                  <textarea
                    {...register('limitacao_descricao')}
                    rows={2}
                    placeholder="Descreva sua limitação ou dificuldade..."
                    className="input-base resize-none mt-2"
                  />
                )}
              </div>

              {/* Informações adicionais */}
              <div>
                <label className="form-label">
                  Outras informações relevantes para elaboração do programa de treinamento
                  <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
                </label>
                <textarea
                  {...register('informacoes_adicionais')}
                  rows={3}
                  placeholder="Inclua aqui exames de sangue recentes, medicamentos, condições especiais ou qualquer informação que julgue importante..."
                  className="input-base resize-none"
                />
              </div>
            </>
          )}

          {/* ── STEP 5: Revisão ───────────────────────── */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
                Revisão das respostas
              </p>

              {[
                { label: 'Nome', value: vals.nome },
                { label: 'Idade', value: vals.idade ? `${vals.idade} anos` : undefined },
                { label: 'Sexo', value: vals.sexo },
                { label: 'Objetivos', value: vals.objetivos?.join(', ') },
                { label: 'Disponibilidade', value: vals.disponibilidade_dias && `${vals.disponibilidade_dias} — ${vals.disponibilidade_minutos} min/dia` },
                { label: 'Exercícios preferidos', value: vals.tipos_exercicio?.join(', ') },
                { label: 'Praticou exercício nos últimos 3 meses', value: vals.praticou_exercicio === 'sim' ? `Sim — ${vals.exercicio_tipo ?? ''}` : 'Não' },
                { label: 'Doenças diagnosticadas', value: vals.tem_doenca === 'sim' ? vals.doencas : 'Nenhuma' },
                { label: 'Medicamentos', value: vals.medicamentos || 'Nenhum' },
                { label: 'Cirurgias', value: vals.fez_cirurgia === 'sim' ? vals.cirurgia_regioes : 'Nenhuma' },
                { label: 'Dor muscular atual', value: vals.tem_dor === 'sim' ? `Sim — ${vals.dor_regioes?.map(r => r.regiao).filter(Boolean).join(', ')}` : 'Não' },
                { label: 'Dor no peito ao exercitar', value: vals.dor_peito_exercicio === 'sim' ? 'Sim' : 'Não' },
                { label: 'Tontura / desmaio', value: vals.tontura_desmaio === 'sim' ? 'Sim' : 'Não' },
                { label: 'Histórico cardíaco familiar', value: vals.historico_cardiaco_familiar === 'sim' ? 'Sim' : 'Não' },
                { label: 'Lesões anteriores', value: vals.teve_lesao === 'sim' ? vals.lesao_descricao : 'Nenhuma' },
                { label: 'Limitações de movimento', value: vals.tem_limitacao === 'sim' ? vals.limitacao_descricao : 'Nenhuma' },
              ]
                .filter(item => item.value)
                .map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5 p-3 rounded-lg bg-muted/50">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-sm text-foreground capitalize">{item.value}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => { setStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0 }) }}
            disabled={step === 0}
            className="btn-secondary gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          <span className="text-xs text-muted-foreground">
            Etapa {step + 1} de {STEPS.length}
          </span>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={nextStep} className="btn-primary gap-2">
              Próximo
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" disabled={loading} className="btn-primary gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar Anamnese
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
