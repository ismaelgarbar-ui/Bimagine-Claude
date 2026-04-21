'use client'

import { useState } from 'react'
import { Sparkles, BarChart2, TrendingUp, ScatterChart, Eye, Check } from 'lucide-react'
import type { ChartType } from '@/lib/supabase/types'

interface Suggestion {
  id: ChartType
  icon: React.ElementType
  title: string
  desc: string
  color: string
  dimColor: string
  confidence: number
}

const suggestions: Suggestion[] = [
  {
    id: 'scatter', icon: ScatterChart,
    title: 'Gráfico de Dispersión',
    desc: 'He detectado correlación entre variables numéricas. ¿Visualizamos la tendencia?',
    color: 'var(--accent)', dimColor: 'var(--accent-dim)', confidence: 94,
  },
  {
    id: 'bar', icon: BarChart2,
    title: 'Comparativa de Barras',
    desc: 'Las primeras columnas categóricas muestran diferencias significativas.',
    color: 'var(--green)', dimColor: 'var(--green-dim)', confidence: 88,
  },
  {
    id: 'line', icon: TrendingUp,
    title: 'Tendencia Temporal',
    desc: 'Detecté valores que parecen secuenciales. Una línea puede revelar el patrón.',
    color: 'var(--amber)', dimColor: 'var(--amber-dim)', confidence: 81,
  },
]

interface SuggestionsPanelProps {
  columns: string[]
  rowCount: number
  onApply: (type: ChartType) => void
}

export default function SuggestionsPanel({ columns, rowCount, onApply }: SuggestionsPanelProps) {
  const [applied, setApplied] = useState<ChartType | null>(null)

  const handleApply = (type: ChartType) => {
    setApplied(type)
    onApply(type)
  }

  return (
    <aside style={{
      width: 260, flexShrink: 0,
      background: 'rgba(255,255,255,0.45)',
      backdropFilter: 'blur(28px) saturate(180%)',
      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      borderLeft: '1px solid rgba(255,255,255,0.55)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={13} color="var(--accent)" strokeWidth={1.8} />
          </div>
          <span style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 12, fontWeight: 800, color: '#111827' }}>Sugerencias IA</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>Basadas en tu dataset cargado</p>
      </div>

      {/* Cards */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {suggestions.map(s => {
          const isApplied = applied === s.id
          return (
            <div key={s.id} style={{
              border: `1px solid ${isApplied ? s.color : 'rgba(200,210,230,0.5)'}`,
              borderRadius: 12, padding: 12, cursor: 'pointer',
              background: isApplied ? s.dimColor : 'rgba(248,249,255,0.8)',
              transition: 'all 0.18s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 7 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: s.dimColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <s.icon size={14} color={s.color} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-plus-jakarta)', marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
              {/* Confidence bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
                <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(200,210,230,0.4)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.confidence}%`, borderRadius: 99, background: s.color, transition: 'width 0.6s' }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-xs)', fontWeight: 600 }}>{s.confidence}%</span>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleApply(s.id)} style={{
                  flex: 1, padding: '6px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta)',
                  background: isApplied ? s.color : s.dimColor,
                  color: isApplied ? 'white' : s.color, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  {isApplied ? <><Check size={11} /> Aplicado</> : 'Aplicar'}
                </button>
                <button style={{
                  padding: '6px 8px', borderRadius: 7, border: '1px solid rgba(200,210,230,0.5)',
                  background: 'white', cursor: 'pointer', color: 'var(--text-muted)',
                }}>
                  <Eye size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dataset summary */}
      <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.3)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Dataset activo</div>
        {[['Filas', rowCount.toLocaleString()], ['Columnas', columns.length], ['Columnas detectadas', columns.slice(0, 3).join(', ')]].map(([k, v]) => (
          <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{k}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1f2937', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v)}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
