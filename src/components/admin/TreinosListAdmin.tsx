'use client'

import { useState, useRef } from 'react'
import { GripVertical } from 'lucide-react'
import { TreinoCardAdmin } from '@/components/admin/TreinoCardAdmin'

interface Exercicio {
  nome: string; series: number; reps: string; carga?: string; observacoes?: string
}
interface Treino {
  id: string; titulo: string; descricao: string | null
  lista_exercicios: Exercicio[]; data_atribuicao: string; ativo: boolean; user_id: string
}
interface Props { treinos: Treino[]; userId: string }

export function TreinosListAdmin({ treinos: initialTreinos, userId }: Props) {
  const [items, setItems] = useState<Treino[]>(initialTreinos)
  const dragIndex = useRef<number | null>(null)
  const [dragActive, setDragActive] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  function onDragStart(i: number) {
    dragIndex.current = i
    setDragActive(i)
  }

  function onDragEnter(i: number) {
    if (dragIndex.current === null || dragIndex.current === i) return
    setDragOver(i)
  }

  function onDragEnd() {
    if (dragIndex.current !== null && dragOver !== null && dragIndex.current !== dragOver) {
      const next = [...items]
      const [moved] = next.splice(dragIndex.current, 1)
      next.splice(dragOver, 0, moved)
      setItems(next)
    }
    dragIndex.current = null
    setDragActive(null)
    setDragOver(null)
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-6">
      {items.map((t, i) => (
        <div
          key={t.id}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragEnter={() => onDragEnter(i)}
          onDragEnd={onDragEnd}
          onDragOver={e => e.preventDefault()}
          className="transition-all duration-150"
          style={{
            opacity: dragActive === i ? 0.35 : 1,
            transform: dragOver === i && dragActive !== i ? 'scale(1.01)' : 'scale(1)',
          }}
        >
          {/* Drag handle bar */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-grab active:cursor-grabbing select-none"
            style={{
              background: dragOver === i && dragActive !== i
                ? 'rgba(249,115,22,0.12)'
                : 'rgba(249,115,22,0.06)',
              border: dragOver === i && dragActive !== i
                ? '1px solid rgba(249,115,22,0.5)'
                : '1px solid rgba(249,115,22,0.15)',
              borderBottom: 'none',
            }}
            title="Arraste para reordenar"
          >
            <GripVertical className="h-4 w-4" style={{ color: '#ea580c' }} />
            <span className="text-xs font-medium" style={{ color: '#ea580c' }}>
              {i + 1}º treino — arraste para reordenar
            </span>
          </div>

          {/* Card wrapper */}
          <div
            className="rounded-b-lg rounded-tr-lg transition-all duration-150"
            style={{
              border: dragOver === i && dragActive !== i
                ? '1px solid rgba(249,115,22,0.5)'
                : '1px solid hsl(var(--border))',
              borderTop: 'none',
              padding: '14px',
              background: 'hsl(var(--card))',
            }}
          >
            <TreinoCardAdmin treino={t} userId={userId} />
          </div>

          {i < items.length - 1 && (
            <div className="mt-6 border-b border-border" />
          )}
        </div>
      ))}
    </div>
  )
}
