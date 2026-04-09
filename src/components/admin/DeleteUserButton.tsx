'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, AlertTriangle, UserX } from 'lucide-react'

interface Props {
  userId: string
  userName: string
  userEmail: string
  redirectAfter?: string
}

export function DeleteUserButton({ userId, userName, userEmail, redirectAfter = '/admin/usuarios' }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao deletar usuário')
      return
    }

    setConfirming(false)
    router.push(redirectAfter)
    router.refresh()
  }

  if (confirming) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setConfirming(false) }}
      >
        <div className="card p-6 max-w-sm w-full shadow-2xl animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
              <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Deletar usuário</h3>
              <p className="text-xs text-muted-foreground">Esta ação é permanente e irreversível</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 mb-4">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>

          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-5">
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
              Todos os dados do usuário serão removidos permanentemente: anamneses, treinos, avaliações físicas e histórico de progressão.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm mb-4">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setConfirming(false); setError(null) }}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: '#dc2626' }}
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trash2 className="h-4 w-4" />
              }
              {loading ? 'Deletando...' : 'Deletar usuário'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Deletar usuário
    </button>
  )
}
