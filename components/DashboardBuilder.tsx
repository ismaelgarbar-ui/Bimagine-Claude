'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Search, Zap, Filter, Plus, X, RefreshCw, Share2 } from 'lucide-react'
import ChartCard from './charts/ChartCard'
import SuggestionsPanel from './SuggestionsPanel'
import Avatar from './ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import type { ChartType } from '@/lib/supabase/types'

const avatarData = [
  { initials: 'MR', color: '#7C6FE0' },
  { initials: 'AL', color: '#34C98A' },
  { initials: 'PG', color: '#F5A623' },
]

const detectedTabs = [
  { id: 'ejecutivo',   label: 'Análisis Ejecutivo', kpi: '—',     kpiLabel: 'Ingresos YTD',   trend: '+18%',   accent: 'var(--accent)' },
  { id: 'operaciones', label: 'Operaciones',         kpi: '—',     kpiLabel: 'SLA cumplido',   trend: '+2.1pp', accent: 'var(--green)' },
  { id: 'finanzas',    label: 'Finanzas',            kpi: '—',     kpiLabel: 'Margen EBITDA',  trend: '-1.8pp', accent: 'var(--amber)' },
]

interface DashboardBuilderProps {
  workspaceId: string
  datasetId: string
  onShare: () => void
}

interface ChartEntry {
  id: string
  type: ChartType
  title: string
  subtitle: string
  size: 'sm' | 'md' | 'lg'
  palette: string
  xKey?: string
  yKeys?: string[]
}

interface Filter { dim: string; val: string }

export default function DashboardBuilder({ workspaceId, datasetId, onShare }: DashboardBuilderProps) {
  const [rows, setRows]           = useState<Record<string, unknown>[]>([])
  const [columns, setColumns]     = useState<string[]>([])
  const [loading, setLoading]     = useState(true)
  const [fileName, setFileName]   = useState('dataset')
  const [charts, setCharts]       = useState<ChartEntry[]>([])
  const [activeTab, setActiveTab] = useState('ejecutivo')
  const [query, setQuery]         = useState('')
  const [aiTyping, setAiTyping]   = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [filters, setFilters]     = useState<Filter[]>([{ dim: 'Periodo', val: 'YTD 2025' }])
  const [period, setPeriod]       = useState('YTD')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Load dataset rows + metadata
  useEffect(() => {
    async function load() {
      const { data: ds } = await supabase.from('datasets').select('*').eq('id', datasetId).single()
      if (ds) {
        setFileName(ds.original_filename)
        setColumns(ds.columns as string[])
      }
      // Fetch rows (max 2000 for perf)
      const { data: dr } = await supabase
        .from('dataset_rows')
        .select('data')
        .eq('dataset_id', datasetId)
        .order('row_index')
        .limit(2000)
      if (dr) setRows(dr.map(r => r.data as Record<string, unknown>))
      setLoading(false)
    }
    load()
  }, [datasetId, supabase])

  // Load saved charts
  useEffect(() => {
    async function loadCharts() {
      const { data } = await supabase.from('charts').select('*').eq('workspace_id', workspaceId).order('position')
      if (data && data.length > 0) {
        setCharts(data.map(c => ({
          id: c.id, type: c.type as ChartType, title: c.title,
          subtitle: c.subtitle ?? '', size: c.size as 'sm' | 'md' | 'lg', palette: c.palette,
        })))
      }
    }
    loadCharts()
  }, [workspaceId, supabase])

  const quickSuggestions = [
    'Compara los primeros valores',
    '¿Cuál es la distribución por categoría?',
    'Muestra la evolución temporal',
    '¿Dónde están los outliers?',
  ]

  const numericCols = columns.filter(c => rows.length > 0 && typeof rows[0][c] === 'number')
  const categoryCols = columns.filter(c => rows.length > 0 && typeof rows[0][c] === 'string')

  const handleQuery = async (q: string) => {
    const val = q || query
    if (!val.trim()) return
    setAiTyping(true)
    setAiResponse('')
    setQuery('')

    await new Promise(r => setTimeout(r, 1600))
    setAiTyping(false)
    setAiResponse(`He analizado tu pregunta: "${val}". Basándome en tus ${rows.length.toLocaleString()} filas y ${columns.length} columnas, he generado las visualizaciones más relevantes a continuación.`)

    // Auto-generate charts based on data
    const newCharts: ChartEntry[] = []
    if (numericCols.length >= 2 && categoryCols.length >= 1) {
      newCharts.push({ id: `c-${Date.now()}-1`, type: 'bar', title: `${numericCols[0]} por ${categoryCols[0]}`, subtitle: `${rows.length.toLocaleString()} registros`, size: 'lg', palette: 'violet', xKey: categoryCols[0], yKeys: numericCols.slice(0, 2) })
      newCharts.push({ id: `c-${Date.now()}-2`, type: 'line', title: 'Evolución de valores', subtitle: 'Serie temporal', size: 'md', palette: 'ocean', xKey: categoryCols[0], yKeys: [numericCols[0]] })
      newCharts.push({ id: `c-${Date.now()}-3`, type: 'donut', title: 'Distribución', subtitle: `Por ${categoryCols[0]}`, size: 'md', palette: 'warm', xKey: categoryCols[0], yKeys: [numericCols[0]] })
    } else if (numericCols.length >= 1) {
      newCharts.push({ id: `c-${Date.now()}-1`, type: 'bar', title: numericCols[0], subtitle: `${rows.length.toLocaleString()} registros`, size: 'lg', palette: 'violet', xKey: columns[0], yKeys: numericCols.slice(0, 2) })
    }

    setCharts(newCharts)

    // Persist to Supabase
    if (newCharts.length > 0) {
      await supabase.from('charts').insert(newCharts.map((c, i) => ({
        workspace_id: workspaceId, dataset_id: datasetId,
        title: c.title, subtitle: c.subtitle, type: c.type,
        size: c.size, palette: c.palette, position: i,
        config: { xKey: c.xKey, yKeys: c.yKeys },
      })))
    }
  }

  const handleSuggestionApply = (type: ChartType) => {
    const xK = categoryCols[0] ?? columns[0]
    const yKs = numericCols.slice(0, 2)
    const entry: ChartEntry = {
      id: `s-${Date.now()}`, type, size: 'lg', palette: 'violet',
      title: type === 'scatter' ? 'Dispersión de valores' : type === 'bar' ? 'Comparativa' : 'Tendencia temporal',
      subtitle: `${rows.length.toLocaleString()} registros · ${columns.length} columnas`,
      xKey: xK, yKeys: yKs,
    }
    setCharts(prev => [entry, ...prev])
    setAiResponse(`Visualización de tipo "${type}" aplicada desde las sugerencias IA.`)
  }

  const updateChart = async (id: string, patch: Partial<ChartEntry>) => {
    setCharts(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
    const dbPatch: Record<string, unknown> = {}
    if (patch.type) dbPatch.type = patch.type
    if (patch.size) dbPatch.size = patch.size
    if (patch.palette) dbPatch.palette = patch.palette
    if (Object.keys(dbPatch).length > 0) {
      await supabase.from('charts').update(dbPatch).eq('id', id)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div className="glass" style={{
        height: 56, borderBottom: '1px solid rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 22px', flexShrink: 0, borderRadius: 0,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 8px rgba(30,40,70,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 14, fontWeight: 700, color: '#111827' }}>
            Workspace — {fileName}
          </span>
          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: 'rgba(52,201,138,0.15)', color: '#059669', fontWeight: 700, border: '1px solid rgba(52,201,138,0.25)', letterSpacing: '0.03em' }}>
            LIVE
          </span>
          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: 'var(--accent-dim)', color: 'var(--accent)', fontWeight: 700, border: '1px solid rgba(124,111,224,0.2)', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={9} strokeWidth={2.2} /> IA ACTIVA
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.6)', fontSize: 10.5, fontWeight: 600, color: '#374151' }}>
            <div className="pulse-ring" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            <span>{fileName}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>· {rows.length.toLocaleString()} filas</span>
            <RefreshCw size={11} color="var(--accent)" strokeWidth={2.2} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex' }}>
            {avatarData.map((a, i) => (
              <div key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                <Avatar initials={a.initials} color={a.color} size={28} />
              </div>
            ))}
          </div>
          <button onClick={onShare} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 8, background: 'var(--accent)', color: 'white', border: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-plus-jakarta)',
          }}>
            <Share2 size={13} strokeWidth={2.2} /> Compartir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        padding: '12px 22px 0', display: 'flex', gap: 8, alignItems: 'flex-end',
        borderBottom: '1px solid rgba(255,255,255,0.25)', flexShrink: 0,
        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px) saturate(160%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 10, padding: '0 6px 12px 0', borderRight: '1px solid rgba(150,160,190,0.22)' }}>
          <Sparkles size={11} color="var(--accent)" strokeWidth={2} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-plus-jakarta)' }}>Auto-generado</span>
        </div>
        {detectedTabs.map(t => {
          const active = activeTab === t.id
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 16px 12px', border: 'none', cursor: 'pointer',
              background: active ? 'rgba(255,255,255,0.65)' : 'transparent',
              backdropFilter: active ? 'blur(20px)' : 'none',
              borderRadius: '10px 10px 0 0',
              borderTop: active ? '1px solid rgba(255,255,255,0.6)' : '1px solid transparent',
              borderLeft: active ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
              borderRight: active ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
              borderBottom: active ? '1px solid rgba(255,255,255,0.65)' : '1px solid transparent',
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--font-plus-jakarta)', fontSize: 12.5, fontWeight: 700,
              color: active ? '#111827' : '#6B7280', transition: 'all 0.2s',
              boxShadow: active ? '0 -2px 8px rgba(30,40,70,0.04), inset 0 1px 0 rgba(255,255,255,0.7)' : 'none',
            }}>
              {t.label}
              {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent }} />}
            </button>
          )
        })}
        <button style={{ padding: '10px 10px 12px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
          <Plus size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {detectedTabs.map(t => {
              const active = activeTab === t.id
              return (
                <div key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                  background: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.38)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  border: active ? `1px solid ${t.accent}` : '1px solid rgba(255,255,255,0.5)',
                  boxShadow: active ? '0 8px 24px rgba(30,40,70,0.10), inset 0 1px 0 rgba(255,255,255,0.8)' : 'inset 0 1px 0 rgba(255,255,255,0.6)',
                  transition: 'all 0.22s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: '#6B7280' }}>{t.kpiLabel}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: t.trend.startsWith('-') ? '#DC2626' : t.accent, padding: '2px 6px', borderRadius: 99, background: t.trend.startsWith('-') ? 'rgba(220,38,38,0.1)' : `${t.accent}20` }}>
                      {t.trend}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                    {loading ? '…' : rows.length > 0 && numericCols.length > 0
                      ? (rows.reduce((s, r) => s + Number(r[numericCols[0]] ?? 0), 0) / (t.id === 'finanzas' ? rows.length : 1)).toLocaleString('es-ES', { maximumFractionDigits: 0 })
                      : t.kpi}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Filter bar */}
          <div className="glass" style={{ borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 10, borderRight: '1px solid rgba(150,160,190,0.25)' }}>
              <Filter size={13} color="var(--accent)" strokeWidth={2.2} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', fontFamily: 'var(--font-plus-jakarta)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Filtros</span>
            </div>
            {filters.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, color: '#1f2937' }}>
                <span style={{ color: 'var(--text-muted)' }}>{f.dim}:</span>
                <span>{f.val}</span>
                <button onClick={() => setFilters(prev => prev.filter((_, j) => j !== i))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, marginLeft: 2, color: 'var(--text-muted)', display: 'flex' }}>
                  <X size={10} strokeWidth={2.2} />
                </button>
              </div>
            ))}
            <button onClick={() => setFilters(prev => [...prev, { dim: 'Región', val: 'Norte' }])} style={{ padding: '5px 10px', borderRadius: 99, border: '1px dashed rgba(150,160,190,0.4)', background: 'transparent', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={10} strokeWidth={2.2} /> Añadir filtro
            </button>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.5)', padding: 2, borderRadius: 8, border: '1px solid rgba(255,255,255,0.5)' }}>
              {['YTD', 'Q1', 'Q2', '30d'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: '3px 10px', borderRadius: 6, border: 'none', fontSize: 10.5, fontWeight: 700,
                  cursor: 'pointer', background: period === p ? 'white' : 'transparent',
                  color: period === p ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-plus-jakarta)',
                  boxShadow: period === p ? '0 1px 3px rgba(30,40,70,0.08)' : 'none',
                }}>{p}</button>
              ))}
            </div>
          </div>

          {/* AI Omnibox */}
          <div className="glass" style={{ borderRadius: 18, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={15} color="var(--accent)" strokeWidth={1.8} />
              </div>
              <span style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Comando IA</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', background: 'rgba(255,255,255,0.55)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.6)' }}>
                <Search size={15} color="var(--text-xs)" />
                <input
                  ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQuery(query)}
                  placeholder="¿Qué quieres descubrir? (ej. Compara ventas por región)"
                  disabled={loading}
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#111827', flex: 1, fontFamily: 'Inter' }}
                />
              </div>
              <button onClick={() => handleQuery(query)} disabled={loading || aiTyping} style={{
                padding: '11px 18px', borderRadius: 8, background: 'var(--accent)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-plus-jakarta)',
                display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.6 : 1,
              }}>
                <Zap size={14} strokeWidth={2} /> Analizar
              </button>
            </div>

            {/* Quick chips */}
            <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
              {quickSuggestions.map(q => (
                <button key={q} onClick={() => { setQuery(q); handleQuery(q) }} style={{
                  padding: '4px 11px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.6)',
                  background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)',
                  fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Inter',
                }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Typing indicator */}
            {aiTyping && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
                      animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bimagine IA está analizando…</span>
              </div>
            )}

            {/* AI response */}
            {aiResponse && !aiTyping && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 8, border: '1px solid rgba(124,111,224,0.2)' }}>
                <span style={{ fontSize: 12, color: '#4338CA', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--accent)' }}>Bimagine:</strong> {aiResponse}
                </span>
              </div>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Cargando datos del dataset…
            </div>
          )}

          {/* Charts grid */}
          {!loading && charts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 14, gridAutoRows: 'min-content' }}>
              {charts.map(c => (
                <ChartCard
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  subtitle={c.subtitle}
                  initialType={c.type}
                  initialSize={c.size}
                  initialPalette={c.palette}
                  data={rows}
                  xKey={c.xKey}
                  yKeys={c.yKeys}
                  onTypeChange={(id, type) => updateChart(id, { type })}
                  onSizeChange={(id, size) => updateChart(id, { size })}
                  onPaletteChange={(id, palette) => updateChart(id, { palette })}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && charts.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
              <div style={{ textAlign: 'center', maxWidth: 340 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <Sparkles size={28} color="var(--accent)" strokeWidth={1.6} />
                </div>
                <div style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
                  Haz tu primera pregunta
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Escribe en el Comando IA qué quieres descubrir, o aplica una sugerencia del panel derecho.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions sidebar */}
        <SuggestionsPanel
          columns={columns}
          rowCount={rows.length}
          onApply={handleSuggestionApply}
        />
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
