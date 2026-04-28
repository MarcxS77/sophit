'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Scale, Calculator, Loader2, CheckCircle2,
  ChevronDown, ChevronUp, RefreshCw, History, Check
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  userId: string
  userName: string
  onSaved?: () => void
}

function calcIMC(peso: number, altura: number) {
  return peso / Math.pow(altura / 100, 2)
}
function imcLabel(imc: number) {
  if (imc < 18.5) return { txt: 'Abaixo do peso', cor: '#3b82f6' }
  if (imc < 25)   return { txt: 'Peso normal',    cor: '#16a34a' }
  if (imc < 30)   return { txt: 'Sobrepeso',      cor: '#f59e0b' }
  if (imc < 35)   return { txt: 'Obesidade I',    cor: '#f97316' }
  if (imc < 40)   return { txt: 'Obesidade II',   cor: '#ef4444' }
  return               { txt: 'Obesidade III',  cor: '#dc2626' }
}

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors hover:bg-muted/50"
      style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)' }}>
      <span className="text-sm font-semibold" style={{ color: '#ea580c' }}>{title}</span>
      {open
        ? <ChevronUp className="h-4 w-4" style={{ color: '#ea580c' }} />
        : <ChevronDown className="h-4 w-4" style={{ color: '#ea580c' }} />}
    </button>
  )
}

function NumField({ label, value, onChange, unit = 'cm', step = '0.1' }:
  { label: string; value: string; onChange: (v: string) => void; unit?: string; step?: string }) {
  return (
    <div>
      <label className="form-label text-xs">
        {label} <span className="text-muted-foreground font-normal">({unit})</span>
      </label>
      <input type="number" step={step} placeholder="—" value={value}
        onChange={e => onChange(e.target.value)} className="input-base" />
    </div>
  )
}

const EMPTY_MED  = { braco_rel_d:'', braco_rel_e:'', braco_cont_d:'', braco_cont_e:'', antebraco_d:'', antebraco_e:'', torax:'', cintura:'', abdomen:'', quadril:'', coxa_d:'', coxa_e:'', panturrilha_d:'', panturrilha_e:'' }
const EMPTY_DOB  = { triceps:'', biceps:'', subescapular:'', 'suprailíaca':'', abdominal:'', coxa:'', panturrilha_medial:'' }
const EMPTY_DIA  = { 'biestilóide':'', 'bieticôndilo':'', biacromial:'', biepicondiliano:'' }
const EMPTY_COMP = { rcq:'', densidade:'', perc_gordura:'', massa_gorda:'', massa_livre_gordura:'', massa_muscular:'' }

function fromDB(obj: any, empty: Record<string,string>): Record<string,string> {
  const result = { ...empty }
  if (!obj) return result
  for (const key of Object.keys(empty)) {
    if (obj[key] != null) result[key] = String(obj[key])
  }
  return result
}

function applyAvaliacao(data: any, setters: {
  setPeso: (v: string) => void; setAltura: (v: string) => void
  setMed: (v: any) => void; setDob: (v: any) => void
  setDia: (v: any) => void; setComp: (v: any) => void
}) {
  setters.setPeso(data.peso ? String(data.peso) : '')
  setters.setAltura(data.altura ? String(data.altura) : '')
  setters.setMed(fromDB(data.medidas_completas ?? data.medidas ?? {}, EMPTY_MED))
  setters.setDob(fromDB(data.dobras_completas ?? data.dobras_cutaneas ?? {}, EMPTY_DOB))
  setters.setDia(fromDB(data.diametros_osseos ?? {}, EMPTY_DIA))
  const compDB = data.composicao ?? {}
  setters.setComp({
    rcq:                 compDB.rcq ?? '',
    densidade:           compDB.densidade ?? '',
    perc_gordura:        String(data.percentual_gordura ?? compDB.perc_gordura ?? ''),
    massa_gorda:         compDB.massa_gorda ?? '',
    massa_livre_gordura: String(data.massa_magra ?? compDB.massa_livre_gordura ?? ''),
    massa_muscular:      compDB.massa_muscular ?? '',
  })
}

export function AvaliacaoForm({ userId, userName, onSaved }: Props) {
  const supabase = createClient()
  const [loadingInit, setLoadingInit] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [historico, setHistorico] = useState<any[]>([])
  const [showHistorico, setShowHistorico] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [sections, setSections] = useState({ basico: true, medidas: true, dobras: false, diametros: false, composicao: true })
  const toggle = (k: keyof typeof sections) => setSections(s => ({ ...s, [k]: !s[k] }))

  const [peso,   setPeso]   = useState('')
  const [altura, setAltura] = useState('')
  const [med,    setMed]    = useState<Record<string,string>>({ ...EMPTY_MED })
  const [dob,    setDob]    = useState<Record<string,string>>({ ...EMPTY_DOB })
  const [dia,    setDia]    = useState<Record<string,string>>({ ...EMPTY_DIA })
  const [comp,   setComp]   = useState<Record<string,string>>({ ...EMPTY_COMP })

  const setters = { setPeso, setAltura, setMed, setDob, setDia, setComp }

  useEffect(() => { init() }, [userId])

  async function init() {
    setLoadingInit(true)
    const { data } = await supabase
      .from('avaliacoes_fisicas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setLoadingInit(false)
    if (!data || data.length === 0) return
    setHistorico(data)
    setSelectedId(data[0].id)
    applyAvaliacao(data[0], setters)
  }

  function applyHistorico(av: any) {
    setSelectedId(av.id)
    applyAvaliacao(av, setters)
    setShowHistorico(false)
  }

  const pesoN   = parseFloat(peso)
  const altN    = parseFloat(altura)
  const imc     = pesoN > 0 && altN > 0 ? calcIMC(pesoN, altN) : null
  const imcInfo = imc ? imcLabel(imc) : null

  const massaLivre = comp.massa_livre_gordura ||
    (pesoN && comp.perc_gordura
      ? (pesoN * (1 - parseFloat(comp.perc_gordura) / 100)).toFixed(2)
      : '')

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('avaliacoes_fisicas').insert({
      user_id: userId,
      peso: pesoN || null, altura: altN || null,
      medidas: med, dobras_cutaneas: dob,
      percentual_gordura: comp.perc_gordura ? parseFloat(comp.perc_gordura) : null,
      massa_magra: massaLivre ? parseFloat(massaLivre) : null,
      medidas_completas: med, dobras_completas: dob,
      diametros_osseos: dia,
      composicao: { ...comp, imc: imc?.toFixed(2), massa_livre_gordura: massaLivre },
    })
    setSaving(false)
    if (!error) {
      setSaved(true)
      onSaved?.()
      setTimeout(() => setSaved(false), 3000)
      init() // recarrega histórico
    }
  }

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Carregando dados...</span>
      </div>
    )
  }

  // Label da avaliação selecionada
  const selectedAv = historico.find(h => h.id === selectedId)
  const selectedLabel = selectedAv
    ? format(new Date(selectedAv.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'Nova avaliação (em branco)'

  return (
    <div className="space-y-4">

      {/* Seletor de histórico */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowHistorico(!showHistorico)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <History className="h-4 w-4 flex-shrink-0" style={{ color: '#f97316' }} />
            <div className="text-left min-w-0">
              <p className="text-xs text-muted-foreground">Base para esta avaliação</p>
              <p className="text-sm font-medium text-foreground truncate">{selectedLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {historico.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 font-medium">
                {historico.length} registros
              </span>
            )}
            {showHistorico
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {showHistorico && (
          <div className="border-t border-border animate-slide-up">
            {/* Opção: em branco */}
            <button
              type="button"
              onClick={() => {
                setSelectedId(null)
                setPeso(''); setAltura('')
                setMed({...EMPTY_MED}); setDob({...EMPTY_DOB})
                setDia({...EMPTY_DIA}); setComp({...EMPTY_COMP})
                setShowHistorico(false)
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Começar do zero</p>
                <p className="text-xs text-muted-foreground">Todos os campos em branco</p>
              </div>
              {selectedId === null && <Check className="h-4 w-4" style={{ color: '#f97316' }} />}
            </button>

            {/* Lista do histórico */}
            {historico.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">Nenhum histórico ainda</div>
            ) : (
              historico.map((av, i) => {
                const compAv = av.composicao ?? {}
                const isSelected = selectedId === av.id
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => applyHistorico(av)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border last:border-0"
                    style={isSelected ? { background: 'rgba(249,115,22,0.06)' } : {}}
                  >
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {format(new Date(av.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        {i === 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 font-medium">
                            mais recente
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-0.5 flex-wrap">
                        {av.peso && <span className="text-xs text-muted-foreground">{av.peso} kg</span>}
                        {av.altura && <span className="text-xs text-muted-foreground">{av.altura} cm</span>}
                        {av.imc && <span className="text-xs text-muted-foreground">IMC {Number(av.imc).toFixed(1)}</span>}
                        {(av.percentual_gordura ?? compAv.perc_gordura) &&
                          <span className="text-xs text-muted-foreground">
                            {av.percentual_gordura ?? compAv.perc_gordura}% gordura
                          </span>}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 flex-shrink-0 ml-2" style={{ color: '#f97316' }} />}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Banner informativo */}
      <div className="flex items-center gap-2 p-3 rounded-lg text-xs"
        style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', color: '#ea580c' }}>
        <RefreshCw className="h-3.5 w-3.5 flex-shrink-0" />
        Altere apenas os campos que mudaram. Ao salvar, um novo registro será criado preservando o histórico.
      </div>

      {/* IMC preview */}
      {imc && imcInfo && (
        <div className="card p-4 flex items-center gap-4 animate-slide-up">
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20">
            <Calculator className="h-5 w-5" style={{ color: '#f97316' }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">IMC calculado</p>
            <p className="text-2xl font-bold text-foreground">{imc.toFixed(1)}</p>
          </div>
          <span className="text-sm font-semibold px-3 py-1 rounded-full border"
            style={{ color: imcInfo.cor, borderColor: imcInfo.cor, background: imcInfo.cor + '15' }}>
            {imcInfo.txt}
          </span>
        </div>
      )}

      {/* BÁSICO */}
      <div className="card overflow-hidden">
        <SectionHeader title="Dados Básicos" open={sections.basico} onToggle={() => toggle('basico')} />
        {sections.basico && (
          <div className="p-5 grid grid-cols-2 gap-4">
            <NumField label="Peso" value={peso} onChange={setPeso} unit="kg" />
            <NumField label="Altura" value={altura} onChange={setAltura} unit="cm" />
          </div>
        )}
      </div>

      {/* MEDIDAS */}
      <div className="card overflow-hidden">
        <SectionHeader title="Medidas Corporais (cm)" open={sections.medidas} onToggle={() => toggle('medidas')} />
        {sections.medidas && (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {([
              ['braco_rel_d',  'Braço Relaxado (D)'],['braco_rel_e',  'Braço Relaxado (E)'],
              ['braco_cont_d', 'Braço Contraído (D)'],['braco_cont_e', 'Braço Contraído (E)'],
              ['antebraco_d',  'Antebraço (D)'],['antebraco_e',  'Antebraço (E)'],
              ['torax','Tórax'],['cintura','Cintura'],['abdomen','Abdômen'],['quadril','Quadril'],
              ['coxa_d','Coxa Média (D)'],['coxa_e','Coxa Média (E)'],
              ['panturrilha_d','Panturrilha (D)'],['panturrilha_e','Panturrilha (E)'],
            ] as [string,string][]).map(([k,lbl]) => (
              <NumField key={k} label={lbl} value={med[k]??''}
                onChange={v => setMed(s => ({...s,[k]:v}))} />
            ))}
          </div>
        )}
      </div>

      {/* DOBRAS */}
      <div className="card overflow-hidden">
        <SectionHeader title="Dobras Cutâneas (mm)" open={sections.dobras} onToggle={() => toggle('dobras')} />
        {sections.dobras && (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {([
              ['triceps','Tríceps'],['biceps','Bíceps'],['subescapular','Subescapular'],
              ['suprailíaca','Suprailíaca'],['abdominal','Abdominal'],['coxa','Coxa'],
              ['panturrilha_medial','Panturrilha Medial'],
            ] as [string,string][]).map(([k,lbl]) => (
              <NumField key={k} label={lbl} value={dob[k]??''}
                onChange={v => setDob(s => ({...s,[k]:v}))} unit="mm" />
            ))}
          </div>
        )}
      </div>

      {/* DIÂMETROS */}
      <div className="card overflow-hidden">
        <SectionHeader title="Diâmetro Ósseo (cm)" open={sections.diametros} onToggle={() => toggle('diametros')} />
        {sections.diametros && (
          <div className="p-5 grid grid-cols-2 gap-4">
            {([
              ['biestilóide','Biestilóide (Punho)'],['bieticôndilo','Bieticôndilo Umeral (Cotovelo)'],
              ['biacromial','Biacromial (Ombros)'],['biepicondiliano','Biepicondiliano do Fêmur (Joelho)'],
            ] as [string,string][]).map(([k,lbl]) => (
              <NumField key={k} label={lbl} value={dia[k]??''}
                onChange={v => setDia(s => ({...s,[k]:v}))} />
            ))}
          </div>
        )}
      </div>

      {/* COMPOSIÇÃO */}
      <div className="card overflow-hidden">
        <SectionHeader title="Composição Corporal" open={sections.composicao} onToggle={() => toggle('composicao')} />
        {sections.composicao && (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label text-xs">IMC <span className="text-muted-foreground font-normal">(auto)</span></label>
              <input type="text" readOnly value={imc ? imc.toFixed(2) : ''}
                placeholder="Calculado automaticamente" className="input-base bg-muted/40 cursor-default" />
            </div>
            <NumField label="RCQ" value={comp.rcq} onChange={v => setComp(s=>({...s,rcq:v}))} unit="índice" />
            <NumField label="Densidade Corporal" value={comp.densidade}
              onChange={v => setComp(s=>({...s,densidade:v}))} unit="g/cm³" />
            <NumField label="% de Gordura" value={comp.perc_gordura}
              onChange={v => setComp(s=>({...s,perc_gordura:v}))} unit="%" />
            <NumField label="Massa Gorda" value={comp.massa_gorda}
              onChange={v => setComp(s=>({...s,massa_gorda:v}))} unit="kg" />
            <div>
              <label className="form-label text-xs">Massa Livre de Gordura <span className="text-muted-foreground font-normal">(kg)</span></label>
              <input type="number" step="0.1" placeholder="Auto-calculado"
                value={massaLivre}
                onChange={e => setComp(s=>({...s,massa_livre_gordura:e.target.value}))}
                className="input-base" />
            </div>
            <NumField label="Massa Muscular Estimada" value={comp.massa_muscular}
              onChange={v => setComp(s=>({...s,massa_muscular:v}))} unit="kg" />
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" />
          : saved  ? <CheckCircle2 className="h-4 w-4" />
          : <Scale className="h-4 w-4" />}
        {saved ? 'Avaliação salva!' : 'Salvar Nova Avaliação'}
      </button>
    </div>
  )
}
