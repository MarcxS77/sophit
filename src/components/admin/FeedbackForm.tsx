'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { feedbackSchema, type FeedbackFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MessageSquare, Loader2, CheckCircle2 } from 'lucide-react'

interface FeedbackFormProps {
  anamneseId: string
  existingFeedback: string | null
  status: string
}

export function FeedbackForm({ anamneseId, existingFeedback, status }: FeedbackFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { feedback_admin: existingFeedback ?? '' },
  })

  async function onSubmit(data: FeedbackFormData) {
    setLoading(true)
    const { error } = await supabase
      .from('anamneses')
      .update({
        feedback_admin: data.feedback_admin,
        status: 'respondido',
      })
      .eq('id', anamneseId)

    setLoading(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4 text-brand-600" />
        {status === 'respondido' ? 'Editar Feedback' : 'Enviar Feedback'}
      </h2>

      {existingFeedback && status === 'respondido' && (
        <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 mb-4">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 text-xs font-medium mb-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Feedback já enviado
          </div>
          <p className="text-sm text-foreground">{existingFeedback}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="form-label">
            {status === 'respondido' ? 'Atualizar feedback' : 'Escreva seu feedback'}
          </label>
          <textarea
            {...register('feedback_admin')}
            rows={5}
            placeholder="Escreva uma avaliação detalhada, orientações e próximos passos para o aluno..."
            className="input-base resize-none"
          />
          {errors.feedback_admin && (
            <p className="form-error">{errors.feedback_admin.message}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === 'respondido' ? 'Atualizar feedback' : 'Enviar feedback'}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-brand-600">
              <CheckCircle2 className="h-4 w-4" />
              Salvo com sucesso!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
