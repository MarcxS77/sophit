import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ClipboardList, Plus, MessageSquare } from 'lucide-react'

export default async function AnamnesePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: anamneses } = await supabase
    .from('anamneses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-brand-600" />
            Anamneses
          </h1>
          <p className="text-muted-foreground mt-1">
            Histórico das suas avaliações de saúde
          </p>
        </div>
        <Link href="/dashboard/anamnese/nova" className="btn-primary gap-2">
          <Plus className="h-4 w-4" />
          Nova Anamnese
        </Link>
      </div>

      {anamneses && anamneses.length > 0 ? (
        <div className="space-y-4">
          {anamneses.map(anamnese => {
            const data = anamnese.data as Record<string, string>
            return (
              <div key={anamnese.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {format(new Date(anamnese.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                      {data.objetivo_principal}
                    </p>
                  </div>
                  <span className={anamnese.status === 'pendente' ? 'badge badge-pending' : 'badge badge-done'}>
                    {anamnese.status === 'pendente' ? 'Aguardando feedback' : 'Respondido'}
                  </span>
                </div>

                {anamnese.feedback_admin && (
                  <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50">
                    <div className="flex items-center gap-1.5 text-xs text-brand-700 dark:text-brand-300 font-medium mb-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Feedback do profissional
                    </div>
                    <p className="text-sm text-foreground">{anamnese.feedback_admin}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-foreground font-medium">Nenhuma anamnese registrada</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Preencha sua primeira anamnese para começar seu acompanhamento
          </p>
          <Link href="/dashboard/anamnese/nova" className="btn-primary inline-flex">
            <Plus className="h-4 w-4" />
            Preencher anamnese
          </Link>
        </div>
      )}
    </div>
  )
}
