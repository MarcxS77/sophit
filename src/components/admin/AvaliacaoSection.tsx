'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AvaliacaoForm } from '@/components/admin/AvaliacaoForm'
import { EvolutionCharts } from '@/components/admin/EvolutionCharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, History, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react'

interface Props {
  userId: string
  userName: string
  initialAvaliacoes: any[]
}

const MEDIDAS_LABELS: Record<string, string> = {
  braco_rel_d: 'Braço Relaxado (D)', braco_rel_e: 'Braço Relaxado (E)',
  braco_cont_d: 'Braço Contraído (D)', braco_cont_e: 'Braço Contraído (E)',
  antebraco_d: 'Antebraço (D)', antebraco_e: 'Antebraço (E)',
  torax: 'Tórax', cintura: 'Cintura', abdomen: 'Abdômen', quadril: 'Quadril',
  coxa_d: 'Coxa Média (D)', coxa_e: 'Coxa Média (E)',
  panturrilha_d: 'Panturrilha (D)', panturrilha_e: 'Panturrilha (E)',
  braco_d: 'Braço (D)', braco_e: 'Braço (E)',
}
const DOBRAS_LABELS: Record<string, string> = {
  triceps: 'Tríceps', biceps: 'Bíceps', subescapular: 'Subescapular',
  suprailíaca: 'Suprailíaca', abdominal: 'Abdominal', coxa: 'Coxa',
  panturrilha_medial: 'Panturrilha Medial', tricipital: 'Tricipital',
}
const DIAMETROS_LABELS: Record<string, string> = {
  biestilóide: 'Biestilóide (Punho)', bieticôndilo: 'Bieticôndilo (Cotovelo)',
  biacromial: 'Biacromial (Ombros)', biepicondiliano: 'Biepicondiliano (Joelho)',
}
const COMP_LABELS: Record<string, string> = {
  imc: 'IMC', rcq: 'RCQ', densidade: 'Densidade (g/cm³)',
  perc_gordura: '% Gordura', massa_gorda: 'Massa Gorda (kg)',
  massa_livre_gordura: 'Massa Livre de Gordura (kg)', massa_muscular: 'Massa Muscular Est. (kg)',
}

function DataRow({ label, value, unit = '' }: { label: string; value: any; unit?: string }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between text-xs py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}{unit && ` ${unit}`}</span>
    </div>
  )
}

function AvaliacaoCard({ av, onDelete }: { av: any; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('avaliacoes_fisicas').delete().eq('id', av.id)
    setDeleting(false)
    onDelete()
  }

  const med  = av.medidas_completas ?? av.medidas ?? {}
  const dob  = av.dobras_completas  ?? av.dobras_cutaneas ?? {}
  const dia  = av.diametros_osseos  ?? {}
  const comp = av.composicao        ?? {}

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
        <div>
          <p className="font-medium text-sm text-foreground">
            {format(new Date(av.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <div className="flex gap-3 mt-0.5 flex-wrap">
            {av.peso    && <span className="text-xs text-muted-foreground">{av.peso} kg</span>}
            {av.altura  && <span className="text-xs text-muted-foreground">{av.altura} cm</span>}
            {av.imc     && <span className="text-xs text-muted-foreground">IMC {Number(av.imc).toFixed(1)}</span>}
            {(av.percentual_gordura ?? comp.perc_gordura) &&
              <span className="text-xs text-muted-foreground">{av.percentual_gordura ?? comp.perc_gordura}% gordura</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={e => { e.stopPropagation(); handleDelete() }} disabled={deleting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-slide-up">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#ea580c'}}>Básico</p>
            <DataRow label="Peso" value={av.peso} unit="kg" />
            <DataRow label="Altura" value={av.altura} unit="cm" />
            <DataRow label="IMC" value={av.imc ? Number(av.imc).toFixed(2) : comp.imc} />
          </div>
          {Object.values(med).some(Boolean) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#ea580c'}}>Medidas (cm)</p>
              {Object.entries(med).filter(([,v])=>v).map(([k,v])=>(
                <DataRow key={k} label={MEDIDAS_LABELS[k]??k} value={v as string} />
              ))}
            </div>
          )}
          <div>
            {Object.values(dob).some(Boolean) && (
              <>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#ea580c'}}>Dobras (mm)</p>
                {Object.entries(dob).filter(([,v])=>v).map(([k,v])=>(
                  <DataRow key={k} label={DOBRAS_LABELS[k]??k} value={v as string} />
                ))}
              </>
            )}
            {Object.values(dia).some(Boolean) && (
              <>
                <p className="text-xs font-bold uppercase tracking-wider mt-3 mb-2" style={{color:'#ea580c'}}>Diâmetros (cm)</p>
                {Object.entries(dia).filter(([,v])=>v).map(([k,v])=>(
                  <DataRow key={k} label={DIAMETROS_LABELS[k]??k} value={v as string} />
                ))}
              </>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#ea580c'}}>Composição</p>
            <DataRow label="% Gordura" value={av.percentual_gordura ?? comp.perc_gordura} unit="%" />
            <DataRow label="Massa Magra" value={av.massa_magra ?? comp.massa_livre_gordura} unit="kg" />
            {Object.entries(comp)
              .filter(([k,v]) => v && !['imc','perc_gordura','massa_livre_gordura'].includes(k))
              .map(([k,v]) => <DataRow key={k} label={COMP_LABELS[k]??k} value={v as string} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export function AvaliacaoSection({ userId, userName, initialAvaliacoes }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'nova'|'historico'>('nova')
  const [avaliacoes, setAvaliacoes] = useState(initialAvaliacoes)

  async function refresh() {
    const { data } = await supabase
      .from('avaliacoes_fisicas').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
    setAvaliacoes(data ?? [])
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'nova',      label: 'Nova Avaliação', icon: Plus },
          { key: 'historico', label: `Histórico${avaliacoes.length > 0 ? ` (${avaliacoes.length})` : ''}`, icon: History },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'text-white'
                : 'text-muted-foreground hover:bg-muted border border-border'
            }`}
            style={tab === t.key ? {background:'linear-gradient(135deg,#f97316,#c2410c)'} : {}}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'nova' && (
        <div className="animate-fade-in">
          <AvaliacaoForm
            userId={userId}
            userName={userName}
            onSaved={() => { refresh(); setTab('historico') }}
          />
        </div>
      )}

      {tab === 'historico' && (
        <div className="space-y-4 animate-fade-in">
          {avaliacoes.length > 1 && (
            <div className="card p-5">
              <p className="text-sm font-semibold text-foreground mb-4">Evolução ao longo do tempo</p>
              <EvolutionCharts avaliacoes={avaliacoes} />
            </div>
          )}
          {avaliacoes.length === 0 ? (
            <div className="card p-10 text-center">
              <History className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada ainda</p>
              <button onClick={() => setTab('nova')} className="btn-primary mt-3 text-xs inline-flex">
                <Plus className="h-3.5 w-3.5" /> Fazer primeira avaliação
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {avaliacoes.map(av => (
                <AvaliacaoCard key={av.id} av={av} onDelete={refresh} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
