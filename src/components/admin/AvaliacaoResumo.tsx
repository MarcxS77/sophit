'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Avaliacao {
  id: string
  created_at: string
  peso: number | null
  altura: number | null
  imc: number | null
  percentual_gordura: number | null
  massa_magra: number | null
  medidas_completas?: Record<string, string>
  medidas?: Record<string, string>
  dobras_completas?: Record<string, string>
  dobras_cutaneas?: Record<string, string>
  diametros_osseos?: Record<string, string>
  composicao?: Record<string, string>
}

const MEDIDAS_LABELS: Record<string, string> = {
  braco_rel_d:'Braço Rel. (D)', braco_rel_e:'Braço Rel. (E)',
  braco_cont_d:'Braço Cont. (D)', braco_cont_e:'Braço Cont. (E)',
  antebraco_d:'Antebraço (D)', antebraco_e:'Antebraço (E)',
  torax:'Tórax', cintura:'Cintura', abdomen:'Abdômen', quadril:'Quadril',
  coxa_d:'Coxa (D)', coxa_e:'Coxa (E)',
  panturrilha_d:'Panturrilha (D)', panturrilha_e:'Panturrilha (E)',
  braco_d:'Braço (D)', braco_e:'Braço (E)',
}
const DOBRAS_LABELS: Record<string, string> = {
  triceps:'Tríceps', biceps:'Bíceps', subescapular:'Subescapular',
  suprailíaca:'Suprailíaca', abdominal:'Abdominal', coxa:'Coxa',
  panturrilha_medial:'Panturrilha Medial', tricipital:'Tricipital',
}
const DIAMETROS_LABELS: Record<string, string> = {
  biestilóide:'Biestilóide', bieticôndilo:'Bieticôndilo',
  biacromial:'Biacromial', biepicondiliano:'Biepicondiliano',
}

function Trend({ current, previous }: { current: number | null; previous: number | null }) {
  if (!current || !previous) return null
  const diff = current - previous
  if (Math.abs(diff) < 0.1) return <Minus className="h-3 w-3 text-muted-foreground" />
  return diff < 0
    ? <span className="flex items-center gap-0.5 text-green-600 text-xs font-medium"><TrendingDown className="h-3 w-3" />{Math.abs(diff).toFixed(1)}</span>
    : <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium"><TrendingUp className="h-3 w-3" />{diff.toFixed(1)}</span>
}

function Card({ label, value, unit, prev }: { label: string; value: any; unit?: string; prev?: any }) {
  if (!value && value !== 0) return null
  return (
    <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-end justify-between gap-1">
        <span className="text-base font-bold text-foreground">{value}{unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}</span>
        {prev !== undefined && <Trend current={parseFloat(value)} previous={parseFloat(prev)} />}
      </div>
    </div>
  )
}

interface Props {
  avaliacoes: Avaliacao[]
}

export function AvaliacaoResumo({ avaliacoes }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!avaliacoes || avaliacoes.length === 0) return (
    <div className="text-center py-6 text-sm text-muted-foreground">
      Nenhuma avaliação física registrada ainda
    </div>
  )

  const latest = avaliacoes[0]
  const prev   = avaliacoes[1] ?? null

  const med  = latest.medidas_completas ?? latest.medidas ?? {}
  const dob  = latest.dobras_completas  ?? latest.dobras_cutaneas ?? {}
  const dia  = latest.diametros_osseos  ?? {}
  const comp = latest.composicao        ?? {}

  const medPrev  = prev ? (prev.medidas_completas ?? prev.medidas ?? {}) : {}
  const compPrev = prev ? (prev.composicao ?? {}) : {}

  const imcLabel = (v: number) => {
    if (v < 18.5) return { txt:'Abaixo do peso', cor:'#3b82f6' }
    if (v < 25)   return { txt:'Normal',          cor:'#16a34a' }
    if (v < 30)   return { txt:'Sobrepeso',        cor:'#f59e0b' }
    if (v < 35)   return { txt:'Obesidade I',      cor:'#f97316' }
    return             { txt:'Obesidade II+',    cor:'#dc2626' }
  }
  const imcVal = latest.imc ?? (comp.imc ? parseFloat(comp.imc) : null)
  const imcInfo = imcVal ? imcLabel(imcVal) : null

  return (
    <div className="space-y-4">
      {/* Destaques principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {latest.peso && (
          <div className="p-3 rounded-xl border border-border" style={{background:'rgba(249,115,22,0.06)'}}>
            <p className="text-xs text-muted-foreground">Peso</p>
            <p className="text-2xl font-bold text-foreground mt-1">{latest.peso}<span className="text-sm font-normal text-muted-foreground ml-1">kg</span></p>
            {prev?.peso && <Trend current={latest.peso} previous={prev.peso} />}
          </div>
        )}
        {imcVal && (
          <div className="p-3 rounded-xl border" style={{borderColor: imcInfo?.cor + '40', background: imcInfo?.cor + '10'}}>
            <p className="text-xs text-muted-foreground">IMC</p>
            <p className="text-2xl font-bold mt-1" style={{color: imcInfo?.cor}}>{imcVal.toFixed(1)}</p>
            <p className="text-xs font-medium" style={{color: imcInfo?.cor}}>{imcInfo?.txt}</p>
          </div>
        )}
        {(latest.percentual_gordura ?? comp.perc_gordura) && (
          <div className="p-3 rounded-xl border border-border" style={{background:'rgba(249,115,22,0.06)'}}>
            <p className="text-xs text-muted-foreground">% Gordura</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {latest.percentual_gordura ?? comp.perc_gordura}
              <span className="text-sm font-normal text-muted-foreground ml-1">%</span>
            </p>
            {(prev?.percentual_gordura ?? compPrev.perc_gordura) && (
              <Trend current={parseFloat(String(latest.percentual_gordura ?? comp.perc_gordura))}
                     previous={parseFloat(String(prev?.percentual_gordura ?? compPrev.perc_gordura))} />
            )}
          </div>
        )}
        {(latest.massa_magra ?? comp.massa_livre_gordura) && (
          <div className="p-3 rounded-xl border border-border" style={{background:'rgba(249,115,22,0.06)'}}>
            <p className="text-xs text-muted-foreground">Massa Magra</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {parseFloat(String(latest.massa_magra ?? comp.massa_livre_gordura)).toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
            </p>
          </div>
        )}
      </div>

      {/* Botão expandir detalhes */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Ocultar detalhes</> : <><ChevronDown className="h-3.5 w-3.5" /> Ver medidas completas ({avaliacoes.length} avaliação{avaliacoes.length !== 1 ? 'ões' : ''})</>}
      </button>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="space-y-4 animate-slide-up">
          {/* Medidas */}
          {Object.values(med).some(Boolean) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#ea580c'}}>Medidas Corporais (cm)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(med).filter(([,v])=>v).map(([k,v]) => (
                  <Card key={k} label={MEDIDAS_LABELS[k]??k} value={v}
                    prev={(medPrev as any)[k]} />
                ))}
              </div>
            </div>
          )}

          {/* Dobras */}
          {Object.values(dob).some(Boolean) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#ea580c'}}>Dobras Cutâneas (mm)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(dob).filter(([,v])=>v).map(([k,v]) => (
                  <Card key={k} label={DOBRAS_LABELS[k]??k} value={v} />
                ))}
              </div>
            </div>
          )}

          {/* Diâmetros */}
          {Object.values(dia).some(Boolean) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#ea580c'}}>Diâmetro Ósseo (cm)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(dia).filter(([,v])=>v).map(([k,v]) => (
                  <Card key={k} label={DIAMETROS_LABELS[k]??k} value={v} />
                ))}
              </div>
            </div>
          )}

          {/* Composição extra */}
          {Object.keys(comp).length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#ea580c'}}>Composição Corporal</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {comp.rcq       && <Card label="RCQ" value={comp.rcq} prev={(compPrev as any).rcq} />}
                {comp.densidade && <Card label="Densidade (g/cm³)" value={comp.densidade} />}
                {comp.massa_gorda && <Card label="Massa Gorda" value={parseFloat(comp.massa_gorda).toFixed(1)} unit="kg" />}
                {comp.massa_muscular && <Card label="Massa Muscular Est." value={parseFloat(comp.massa_muscular).toFixed(1)} unit="kg" />}
              </div>
            </div>
          )}

          {/* Histórico resumido */}
          {avaliacoes.length > 1 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#ea580c'}}>Histórico de avaliações</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {avaliacoes.map((av, i) => (
                  <div key={av.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/40">
                    <span className="text-muted-foreground">
                      {new Date(av.created_at).toLocaleDateString('pt-BR')}
                      {i === 0 && <span className="ml-2 text-orange-600 font-medium">← mais recente</span>}
                    </span>
                    <div className="flex gap-4">
                      {av.peso && <span className="text-foreground font-medium">{av.peso} kg</span>}
                      {(av.percentual_gordura ?? (av.composicao as any)?.perc_gordura) &&
                        <span className="text-foreground font-medium">
                          {av.percentual_gordura ?? (av.composicao as any)?.perc_gordura}% gord.
                        </span>}
                      {av.imc && <span className="text-foreground font-medium">IMC {Number(av.imc).toFixed(1)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
