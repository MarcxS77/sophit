'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Scale, Calculator, Loader2, CheckCircle2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

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
      {open ? <ChevronUp className="h-4 w-4" style={{ color: '#ea580c' }} />
             : <ChevronDown className="h-4 w-4" style={{ color: '#ea580c' }} />}
    </button>
  )
}

function NumField({ label, value, onChange, unit = 'cm', step = '0.1', readOnly = false }:
  { label: string; value: string; onChange: (v: string) => void; unit?: string; step?: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="form-label text-xs">
        {label} <span className="text-muted-foreground font-normal">({unit})</span>
      </label>
      <input
        type="number" step={step} placeholder="—" value={value}
        onChange={e => onChange(e.target.value)}
        readOnly={readOnly}
        className={`input-base ${readOnly ? 'bg-muted/40 cursor-default' : ''}`}
      />
    </div>
  )
}

const EMPTY_MED = {
  braco_rel_d:'', braco_rel_e:'', braco_cont_d:'', braco_cont_e:'',
  antebraco_d:'', antebraco_e:'', torax:'', cintura:'', abdomen:'',
  quadril:'', coxa_d:'', coxa_e:'', panturrilha_d:'', panturrilha_e:'',
}
const EMPTY_DOB = {
  triceps:'', biceps:'', subescapular:'', 'suprailíaca':'',
  abdominal:'', coxa:'', panturrilha_medial:'',
}
const EMPTY_DIA = {
  'biestilóide':'', 'bieticôndilo':'', biacromial:'', biepicondiliano:'',
}
const EMPTY_COMP = {
  rcq:'', densidade:'', perc_gordura:'', massa_gorda:'',
  massa_livre_gordura:'', massa_muscular:'',
}

function fromDB(obj: any, empty: Record<string,string>): Record<string,string> {
  if (!obj) return { ...empty }
  const result = { ...empty }
  for (const key of Object.keys(empty)) {
    if (obj[key] !== undefined && obj[key] !== null) {
      result[key] = String(obj[key])
    }
  }
  return result
}

export function AvaliacaoForm({ userId, userName, onSaved }: Props) {
  const supabase = createClient()
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [sections, setSections] = useState({ basico: true, medidas: true, dobras: false, diametros: false, composicao: true })

  const [peso,   setPeso]   = useState('')
  const [altura, setAltura] = useState('')
  const [med,    setMed]    = useState<Record<string,string>>({ ...EMPTY_MED })
  const [dob,    setDob]    = useState<Record<string,string>>({ ...EMPTY_DOB })
  const [dia,    setDia]    = useState<Record<string,string>>({ ...EMPTY_DIA })
  const [comp,   setComp]   = useState<Record<string,string>>({ ...EMPTY_COMP })

  // Carrega a última avaliação ao montar
  useEffect(() => {
    loadLast()
  }, [userId])

  async function loadLast() {
    setLoading(true)
    const { data } = await supabase
      .from('avaliacoes_fisicas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setLoading(false)

    if (!data) return

    setPeso(data.peso   ? String(data.peso)   : '')
    setAltura(data.altura ? String(data.altura) : '')

    const medDB = data.medidas_completas ?? data.medidas ?? {}
    const dobDB = data.dobras_completas  ?? data.dobras_cutaneas ?? {}
    const diaDB = data.diametros_osseos  ?? {}
    const compDB = data.composicao       ?? {}

    setMed(fromDB(medDB, EMPTY_MED))
    setDob(fromDB(dobDB, EMPTY_DOB))
    setDia(fromDB(diaDB, EMPTY_DIA))
    setComp({
      rcq:                 compDB.rcq                  ?? '',
      densidade:           compDB.densidade             ?? '',
      perc_gordura:        String(data.percentual_gordura ?? compDB.perc_gordura ?? ''),
      massa_gorda:         compDB.massa_gorda           ?? '',
      massa_livre_gordura: String(data.massa_magra ?? compDB.massa_livre_gordura ?? ''),
      massa_muscular:      compDB.massa_muscular        ?? '',
    })
  }

  const toggle = (k: keyof typeof sections) => setSections(s => ({ ...s, [k]: !s[k] }))

  const pesoN = parseFloat(peso)
  const altN  = parseFloat(altura)
  const imc   = pesoN > 0 && altN > 0 ? calcIMC(pesoN, altN) : null
  const imcInfo = imc ? imcLabel(imc) : null

  const massaLivre = comp.massa_livre_gordura ||
    (pesoN && comp.perc_gordura
      ? (pesoN * (1 - parseFloat(comp.perc_gordura) / 100)).toFixed(2)
      : '')

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('avaliacoes_fisicas').insert({
      user_id:            userId,
      peso:               pesoN || null,
      altura:             altN  || null,
      medidas:            med,
      dobras_cutaneas:    dob,
      percentual_gordura: comp.perc_gordura ? parseFloat(comp.perc_gordura) : null,
      massa_magra:        massaLivre ? parseFloat(massaLivre) : null,
      medidas_completas:  med,
      dobras_completas:   dob,
      diametros_osseos:   dia,
      composicao: {
        ...comp,
        imc: imc?.toFixed(2),
        massa_livre_gordura: massaLivre,
      },
    })
    setSaving(false)
    if (!error) {
      setSaved(true)
      onSaved?.()
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Carregando última avaliação...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Banner informativo */}
      <div className="flex items-center gap-2 p-3 rounded-lg text-xs"
        style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', color: '#ea580c' }}>
        <RefreshCw className="h-3.5 w-3.5 flex-shrink-0" />
        Os campos foram pré-preenchidos com a última avaliação. Altere apenas o que mudou e salve — um novo registro será criado.
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
              ['braco_rel_d',  'Braço Relaxado (D)'],
              ['braco_rel_e',  'Braço Relaxado (E)'],
              ['braco_cont_d', 'Braço Contraído (D)'],
              ['braco_cont_e', 'Braço Contraído (E)'],
              ['antebraco_d',  'Antebraço (D)'],
              ['antebraco_e',  'Antebraço (E)'],
              ['torax',        'Tórax'],
              ['cintura',      'Cintura'],
              ['abdomen',      'Abdômen'],
              ['quadril',      'Quadril'],
              ['coxa_d',       'Coxa Média (D)'],
              ['coxa_e',       'Coxa Média (E)'],
              ['panturrilha_d','Panturrilha (D)'],
              ['panturrilha_e','Panturrilha (E)'],
            ] as [string, string][]).map(([k, lbl]) => (
              <NumField key={k} label={lbl} value={med[k] ?? ''}
                onChange={v => setMed(s => ({ ...s, [k]: v }))} />
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
              ['triceps',           'Tríceps'],
              ['biceps',            'Bíceps'],
              ['subescapular',      'Subescapular'],
              ['suprailíaca',       'Suprailíaca'],
              ['abdominal',         'Abdominal'],
              ['coxa',              'Coxa'],
              ['panturrilha_medial','Panturrilha Medial'],
            ] as [string, string][]).map(([k, lbl]) => (
              <NumField key={k} label={lbl} value={dob[k] ?? ''}
                onChange={v => setDob(s => ({ ...s, [k]: v }))} unit="mm" />
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
              ['biestilóide',     'Biestilóide (Punho)'],
              ['bieticôndilo',    'Bieticôndilo Umeral (Cotovelo)'],
              ['biacromial',      'Biacromial (Ombros)'],
              ['biepicondiliano', 'Biepicondiliano do Fêmur (Joelho)'],
            ] as [string, string][]).map(([k, lbl]) => (
              <NumField key={k} label={lbl} value={dia[k] ?? ''}
                onChange={v => setDia(s => ({ ...s, [k]: v }))} />
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
            <NumField label="RCQ" value={comp.rcq} onChange={v => setComp(s => ({...s, rcq:v}))} unit="índice" />
            <NumField label="Densidade Corporal" value={comp.densidade}
              onChange={v => setComp(s => ({...s, densidade:v}))} unit="g/cm³" />
            <NumField label="% de Gordura" value={comp.perc_gordura}
              onChange={v => setComp(s => ({...s, perc_gordura:v}))} unit="%" />
            <NumField label="Massa Gorda" value={comp.massa_gorda}
              onChange={v => setComp(s => ({...s, massa_gorda:v}))} unit="kg" />
            <div>
              <label className="form-label text-xs">Massa Livre de Gordura <span className="text-muted-foreground font-normal">(kg)</span></label>
              <input type="number" step="0.1" placeholder="Auto-calculado"
                value={massaLivre}
                onChange={e => setComp(s => ({...s, massa_livre_gordura: e.target.value}))}
                className="input-base" />
            </div>
            <NumField label="Massa Muscular Estimada" value={comp.massa_muscular}
              onChange={v => setComp(s => ({...s, massa_muscular:v}))} unit="kg" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" />
            : saved  ? <CheckCircle2 className="h-4 w-4" />
            : <Scale className="h-4 w-4" />}
          {saved ? 'Avaliação salva!' : 'Salvar Nova Avaliação'}
        </button>
        <button onClick={loadLast} disabled={loading} type="button"
          className="btn-secondary gap-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Recarregar última
        </button>
      </div>
    </div>
  )
}
