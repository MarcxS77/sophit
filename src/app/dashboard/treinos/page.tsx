import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Dumbbell, Calendar, Target, TrendingUp } from 'lucide-react'
import { ProgressaoExercicio } from '@/components/dashboard/ProgressaoExercicio'

export default async function TreinosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: treinos } = await supabase
    .from('treinos')
    .select('*')
    .eq('user_id', user.id)
    .order('data_atribuicao', { ascending: false })

  const ativos = treinos?.filter(t => t.ativo) ?? []
  const inativos = treinos?.filter(t => !t.ativo) ?? []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Dumbbell className="h-6 w-6" style={{color:'#f97316'}} />
          Meus Treinos
        </h1>
        <p className="text-muted-foreground mt-1">
          Registre suas cargas e acompanhe sua evolução
        </p>
      </div>

      {ativos.length > 0 && (
        <div className="space-y-6 mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Treinos Ativos</p>
          {ativos.map(treino => (
            <TreinoCard key={treino.id} treino={treino} userId={user.id} active />
          ))}
        </div>
      )}

      {inativos.length > 0 && (
        <div className="space-y-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Histórico</p>
          {inativos.map(treino => (
            <TreinoCard key={treino.id} treino={treino} userId={user.id} active={false} />
          ))}
        </div>
      )}

      {(!treinos || treinos.length === 0) && (
        <div className="card p-16 text-center">
          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-foreground font-medium">Nenhum treino atribuído</p>
          <p className="text-sm text-muted-foreground mt-1">
            Aguarde seu profissional criar um treino para você.
          </p>
        </div>
      )}
    </div>
  )
}

function TreinoCard({ treino, userId, active }: { treino: any; userId: string; active: boolean }) {
  const exercicios = treino.lista_exercicios ?? []

  return (
    <div className={`card overflow-hidden ${!active ? 'opacity-70' : ''}`}>
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{treino.titulo}</h3>
              <span className={active
                ? 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                : 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground'
              }>
                {active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            {treino.descricao && (
              <p className="text-sm text-muted-foreground">{treino.descricao}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(treino.data_atribuicao), 'dd/MM/yyyy')}
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            {exercicios.length} exercício{exercicios.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Clique em cada exercício para registrar carga
          </div>
        </div>
      </div>

      {/* Exercícios com progressão */}
      <div className="p-4 space-y-3">
        {exercicios.map((ex: any, i: number) => (
          <ProgressaoExercicio
            key={i}
            exercicio={ex}
            treinoId={treino.id}
            userId={userId}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
