import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  ClipboardList,
  Dumbbell,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Busca treinos ativos
  const { data: treinos } = await supabase
    .from('treinos')
    .select('*')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .order('data_atribuicao', { ascending: false })
    .limit(3)

  // Busca anamneses
  const { data: anamneses } = await supabase
    .from('anamneses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const pendentes = anamneses?.filter((a) => a.status === 'pendente').length ?? 0
  const respondidas = anamneses?.filter((a) => a.status === 'respondido').length ?? 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Painel</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe seu progresso e treinos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: ClipboardList,
            label: 'Anamneses enviadas',
            value: anamneses?.length ?? 0,
            color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20',
          },
          {
            icon: MessageSquare,
            label: 'Feedbacks recebidos',
            value: respondidas,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
          },
          {
            icon: Dumbbell,
            label: 'Treinos ativos',
            value: treinos?.length ?? 0,
            color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
          },
          {
            icon: TrendingUp,
            label: 'Pendentes de resposta',
            value: pendentes,
            color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className={`inline-flex p-2.5 rounded-lg ${stat.color} mb-4`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treino Atual */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-brand-600" />
              Treinos Ativos
            </h2>
            <Link
              href="/dashboard/treinos"
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {treinos && treinos.length > 0 ? (
            <div className="space-y-3">
              {treinos.map((treino) => (
                <Link
                  key={treino.id}
                  href={`/dashboard/treinos/${treino.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">{treino.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {treino.lista_exercicios?.length ?? 0} exercícios
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">
                Nenhum treino atribuído ainda
              </p>
            </div>
          )}
        </div>

        {/* Feedbacks recentes */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-600" />
              Feedbacks Recentes
            </h2>
            <Link
              href="/dashboard/anamnese"
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Ver histórico <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {anamneses && anamneses.filter((a) => a.feedback_admin).length > 0 ? (
            <div className="space-y-3">
              {anamneses
                .filter((a) => a.feedback_admin)
                .slice(0, 3)
                .map((anamnese) => (
                  <div
                    key={anamnese.id}
                    className="p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="badge badge-done">Respondido</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(anamnese.updated_at), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {anamnese.feedback_admin}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">
                Nenhum feedback recebido ainda
              </p>
              <Link href="/dashboard/anamnese/nova" className="btn-primary mt-3 text-xs">
                Enviar anamnese
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
