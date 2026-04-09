import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, ArrowRight, Search } from 'lucide-react'
import { DeleteUserButton } from '@/components/admin/DeleteUserButton'

export default async function UsuariosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'user')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" style={{ color: '#f97316' }} />
            Alunos
          </h1>
          <p className="text-muted-foreground mt-1">
            {profiles?.length ?? 0} aluno{(profiles?.length ?? 0) !== 1 ? 's' : ''} cadastrado{(profiles?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="search" placeholder="Buscar aluno..." className="input-base pl-9 w-64" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {profiles && profiles.length > 0 ? (
          profiles.map(profile => {
            const initials = (profile.full_name ?? profile.email)
              .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
            return (
              <div key={profile.id} className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg,#f97316,#c2410c)' }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{profile.full_name ?? 'Sem nome'}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Desde {format(new Date(profile.created_at), "MMM 'de' yyyy", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/usuarios/${profile.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-foreground"
                  >
                    Ver perfil
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <DeleteUserButton
                    userId={profile.id}
                    userName={profile.full_name ?? 'Sem nome'}
                    userEmail={profile.email}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">Nenhum aluno cadastrado ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}
