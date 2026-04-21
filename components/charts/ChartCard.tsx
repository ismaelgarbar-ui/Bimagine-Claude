'use client'

import { useState } from 'react'
import { BarChart2, TrendingUp, AreaChart, PieChart, Maximize2 } from 'lucide-react'
import ChartRenderer from './ChartRenderer'
import { palettes } from '@/lib/colors'
import type { ChartType } from '@/lib/supabase/types'

const chartTypes: { id: ChartType; Icon: React.ElementType; label: string }[] = [
  { id: 'bar',    Icon: BarChart2,   label: 'Barras' },
  { id: 'line',   Icon: TrendingUp,  label: 'Línea' },
  { id: 'area',   Icon: AreaChart,   label: 'Área' },
  { id: 'donut',  Icon: PieChart,    label: 'Donut' },
]

const sizeMap: Record<'sm' | 'md' | 'lg', string> = { sm: '3', md: '6', lg: '12' }

interface ChartCardProps {
  id?: string
  title: string
  subtitle?: string
  initialType?: ChartType
  initialSize?: 'sm' | 'md' | 'lg'
  initialPalette?: string
  data: Record<string, unknown>[]
  xKey?: string
  yKeys?: string[]
  onTypeChange?: (id: string, type: ChartType) => void
  onSizeChange?: (id: string, size: 'sm' | 'md' | 'lg') => void
  onPaletteChange?: (id: string, palette: string) => void
}

const PaletteSwatch = ({ colors, active, onClick, name }: { colors: string[]; active: boolean; onClick: () => void; name: string }) => (
  <button onClick={onClick} title={name} style={{
    display: 'flex', padding: 3, borderRadius: 6, gap: 2, cursor: 'pointer',
    border: active ? '1.5px solid var(--accent)' : '1.5px solid rgba(255,255,255,0.5)',
    background: 'rgba(255,255,255,0.6)',
  }}>
    {colors.slice(0, 4).map((c, i) => (
      <div key={i} style={{ width: 9, height: 13, borderRadius: 2, background: c }} />
    ))}
  </button>
)

export default function ChartCard({
  id = '', title, subtitle, initialType = 'bar', initialSize = 'md',
  initialPalette = 'violet', data, xKey, yKeys,
  onTypeChange, onSizeChange, onPaletteChange,
}: ChartCardProps) {
  const [type, setType]       = useState<ChartType>(initialType)
  const [size, setSize]       = useState<'sm' | 'md' | 'lg'>(initialSize)
  const [palette, setPalette] = useState(initialPalette)
  const [hovered, setHovered] = useState(false)

  const compact = size === 'sm'

  const cycleSize = () => {
    const next = size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'sm'
    setSize(next)
    onSizeChange?.(id, next)
  }

  return (
    <div
      className="glass animate-fade-in-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        gridColumn: `span ${sizeMap[size]}`,
        borderRadius: 16, padding: '16px 18px 14px',
        transition: 'box-shadow 0.25s, transform 0.25s',
        transform: hovered ? 'translateY(-1px)' : 'none',
        position: 'relative', minWidth: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: compact ? 12 : 14, fontWeight: 700, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          {!compact && subtitle && <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{subtitle}</div>}
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', gap: 4, alignItems: 'center',
          opacity: hovered ? 1 : 0.3, transition: 'opacity 0.2s',
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)',
          padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.5)',
        }}>
          {chartTypes.map(({ id: ct, Icon, label }) => (
            <button key={ct} onClick={() => { setType(ct); onTypeChange?.(id, ct) }} title={label} style={{
              width: 22, height: 22, border: 'none', borderRadius: 5, cursor: 'pointer',
              background: type === ct ? 'var(--accent)' : 'transparent',
              color: type === ct ? 'white' : 'rgba(80,90,130,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
            }}>
              <Icon size={11} strokeWidth={2} />
            </button>
          ))}
          <div style={{ width: 1, height: 16, background: 'rgba(150,160,190,0.3)', margin: '0 2px' }} />
          {Object.entries(palettes).map(([p, colors]) => (
            <PaletteSwatch key={p} colors={colors} active={palette === p} name={p}
              onClick={() => { setPalette(p); onPaletteChange?.(id, p) }} />
          ))}
          <div style={{ width: 1, height: 16, background: 'rgba(150,160,190,0.3)', margin: '0 2px' }} />
          <button onClick={cycleSize} title="Cambiar tamaño" style={{
            width: 24, height: 22, border: 'none', borderRadius: 5, cursor: 'pointer',
            background: 'transparent', color: 'rgba(60,70,110,1)', fontSize: 9, fontWeight: 700,
            fontFamily: 'var(--font-plus-jakarta)',
          }}>
            {size.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Chart */}
      <ChartRenderer type={type} data={data} palette={palette} xKey={xKey} yKeys={yKeys} compact={compact} height={compact ? 110 : 180} />

      {/* Resize handle */}
      <button onClick={cycleSize} style={{
        position: 'absolute', bottom: 4, right: 4, width: 16, height: 16,
        border: 'none', background: 'transparent', cursor: 'nwse-resize',
        opacity: hovered ? 0.5 : 0.15, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Maximize2 size={10} color="#3C4680" />
      </button>
    </div>
  )
}
