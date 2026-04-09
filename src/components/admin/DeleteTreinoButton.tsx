'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

export function DeleteTreinoButton({ treinoId, titulo }: { treinoId: string; titulo: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from('treinos').delete().eq('id', treinoId)
    setLoading(false)
    if (!error) {
      setConfirming(false)
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
        <div className="card p-6 max-w-sm w-full shadow-xl animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Deletar treino</h3>
              <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Tem certeza que deseja deletar o treino <span className="font-medium text-foreground">"{titulo}"</span>?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all"
              style={{background:'#dc2626'}}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Deletar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-800"
      title="Deletar treino"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Deletar
    </button>
  )
}
