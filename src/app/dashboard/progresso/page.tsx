import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Camera } from 'lucide-react'
import { FotosProgresso } from '@/components/FotosProgresso'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meu Progresso — Sophit',
}

export default async function ProgressoPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Camera className="h-6 w-6" style={{ color: '#f97316' }} />
          Meu Progresso
        </h1>
        <p className="text-muted-foreground mt-1">
          Registre fotos de antes e depois para acompanhar sua evolução visual
        </p>
      </div>
      <FotosProgresso userId={user.id} isAdmin={false} />
    </div>
  )
}
