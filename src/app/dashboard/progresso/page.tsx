'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Camera, Upload, Trash2, Loader2, ImageIcon,
  CheckCircle2, AlertCircle, Calendar, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Foto {
  id: string
  tipo: 'antes' | 'depois'
  url: string
  storage_path: string
  descricao: string | null
  data_foto: string
  created_at: string
}

interface Props {
  userId: string
  isAdmin?: boolean
}

export function FotosProgresso({ userId, isAdmin = false }: Props) {
  const supabase = createClient()
  const [fotos, setFotos] = useState<Foto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<'antes' | 'depois' | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<Foto | null>(null)
  const [descricao, setDescricao] = useState('')
  const [dataFoto, setDataFoto] = useState(new Date().toISOString().slice(0, 10))
  const inputAntes = useRef<HTMLInputElement>(null)
  const inputDepois = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchFotos() }, [userId])

  async function fetchFotos() {
    setLoading(true)
    const { data } = await supabase
      .from('fotos_progresso')
      .select('*')
      .eq('user_id', userId)
      .order('data_foto', { ascending: false })
    setFotos(data ?? [])
    setLoading(false)
  }

  async function handleUpload(file: File, tipo: 'antes' | 'depois') {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB.')
      return
    }

    setUploading(tipo)
    setError(null)

    const ext = file.name.split('.').pop()
    const path = `${userId}/${tipo}_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('progress-photos')
      .upload(path, file, { upsert: false })

    if (uploadError) {
      setError('Erro ao fazer upload. Tente novamente.')
      setUploading(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('progress-photos')
      .getPublicUrl(path)

    const { error: dbError } = await supabase.from('fotos_progresso').insert({
      user_id: userId,
      tipo,
      url: publicUrl,
      storage_path: path,
      descricao: descricao || null,
      data_foto: dataFoto,
    })

    if (dbError) {
      setError('Erro ao salvar foto.')
    } else {
      setSuccess(`Foto "${tipo}" salva com sucesso!`)
      setTimeout(() => setSuccess(null), 3000)
      await fetchFotos()
    }
    setUploading(null)
    setDescricao('')
  }

  async function handleDelete(foto: Foto) {
    setDeleting(foto.id)
    await supabase.storage.from('progress-photos').remove([foto.storage_path])
    await supabase.from('fotos_progresso').delete().eq('id', foto.id)
    await fetchFotos()
    setDeleting(null)
    if (lightbox?.id === foto.id) setLightbox(null)
  }

  const fotosAntes = fotos.filter(f => f.tipo === 'antes')
  const fotosDepois = fotos.filter(f => f.tipo === 'depois')

  // Pares mais recentes para comparação
  const pares = Math.max(fotosAntes.length, fotosDepois.length)

  return (
    <div className="space-y-6">

      {/* Upload section */}
      <div className="card p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Camera className="h-4 w-4" style={{ color: '#f97316' }} />
          {isAdmin ? 'Adicionar foto do aluno' : 'Adicionar nova foto'}
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label text-xs">Data da foto</label>
            <input
              type="date"
              value={dataFoto}
              onChange={e => setDataFoto(e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="form-label text-xs">Descrição (opcional)</label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Início do programa, 3 meses..."
              className="input-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Upload Antes */}
          <div>
            <input
              ref={inputAntes}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'antes')}
            />
            <button
              onClick={() => inputAntes.current?.click()}
              disabled={uploading !== null}
              className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading === 'antes'
                ? <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#f97316' }} />
                : <Upload className="h-6 w-6 text-muted-foreground" />}
              <span className="text-sm font-medium text-foreground">
                {uploading === 'antes' ? 'Enviando...' : 'Foto ANTES'}
              </span>
              <span className="text-xs text-muted-foreground">JPG, PNG ou WEBP · max 10MB</span>
            </button>
          </div>

          {/* Upload Depois */}
          <div>
            <input
              ref={inputDepois}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'depois')}
            />
            <button
              onClick={() => inputDepois.current?.click()}
              disabled={uploading !== null}
              className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading === 'depois'
                ? <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#f97316' }} />
                : <Upload className="h-6 w-6 text-muted-foreground" />}
              <span className="text-sm font-medium text-foreground">
                {uploading === 'depois' ? 'Enviando...' : 'Foto DEPOIS'}
              </span>
              <span className="text-xs text-muted-foreground">JPG, PNG ou WEBP · max 10MB</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />{success}
          </div>
        )}
      </div>

      {/* Fotos */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : fotos.length === 0 ? (
        <div className="card p-12 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-foreground">Nenhuma foto registrada</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione fotos de antes e depois para acompanhar a evolução</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comparação lado a lado */}
          {fotosAntes.length > 0 && fotosDepois.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: '#f97316' }} />
                Comparativo Antes × Depois
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Antes mais recente */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">ANTES</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(fotosAntes[0].data_foto), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <button
                    onClick={() => setLightbox(fotosAntes[0])}
                    className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                  >
                    <img src={fotosAntes[0].url} alt="Antes" className="w-full h-full object-cover" />
                  </button>
                  {fotosAntes[0].descricao && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">{fotosAntes[0].descricao}</p>
                  )}
                </div>
                {/* Depois mais recente */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">DEPOIS</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(fotosDepois[0].data_foto), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <button
                    onClick={() => setLightbox(fotosDepois[0])}
                    className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                  >
                    <img src={fotosDepois[0].url} alt="Depois" className="w-full h-full object-cover" />
                  </button>
                  {fotosDepois[0].descricao && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">{fotosDepois[0].descricao}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Galeria completa */}
          {['antes', 'depois'].map(tipo => {
            const lista = tipo === 'antes' ? fotosAntes : fotosDepois
            if (lista.length === 0) return null
            return (
              <div key={tipo} className="card p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    tipo === 'antes'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {tipo.toUpperCase()}
                  </span>
                  <span className="text-sm text-muted-foreground font-normal">{lista.length} foto{lista.length !== 1 ? 's' : ''}</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {lista.map(foto => (
                    <div key={foto.id} className="relative group">
                      <button
                        onClick={() => setLightbox(foto)}
                        className="w-full aspect-square rounded-xl overflow-hidden bg-muted hover:opacity-90 transition-opacity block"
                      >
                        <img src={foto.url} alt={tipo} className="w-full h-full object-cover" />
                      </button>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(foto.data_foto), 'dd/MM/yy')}
                        </span>
                        <button
                          onClick={() => handleDelete(foto)}
                          disabled={deleting === foto.id}
                          className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {deleting === foto.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {foto.descricao && (
                        <p className="text-xs text-muted-foreground truncate">{foto.descricao}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={lightbox.url}
              alt={lightbox.tipo}
              className="w-full rounded-xl max-h-[80vh] object-contain"
            />
            <div className="flex items-center justify-between mt-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                lightbox.tipo === 'antes'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-green-500/20 text-green-300'
              }`}>
                {lightbox.tipo.toUpperCase()}
              </span>
              <span className="text-white/60 text-xs">
                {format(new Date(lightbox.data_foto), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <button
                onClick={() => handleDelete(lightbox)}
                disabled={deleting === lightbox.id}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {deleting === lightbox.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
                Remover
              </button>
            </div>
            {lightbox.descricao && (
              <p className="text-white/50 text-xs text-center mt-2">{lightbox.descricao}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
