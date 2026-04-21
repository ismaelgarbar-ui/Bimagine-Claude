'use client'

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { palettes } from '@/lib/colors'

interface ChartRendererProps {
  type: 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'scatter'
  data: Record<string, unknown>[]
  palette?: string
  xKey?: string
  yKeys?: string[]
  height?: number
  compact?: boolean
}

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelRenderProps) => {
  if ((percent ?? 0) < 0.06) return null
  const ir = Number(innerRadius ?? 0)
  const or = Number(outerRadius ?? 0)
  const radius = ir + (or - ir) * 0.5
  const angle = Number(midAngle ?? 0)
  const x = Number(cx ?? 0) + radius * Math.cos(-angle * RADIAN)
  const y = Number(cy ?? 0) + radius * Math.sin(-angle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${((Number(percent ?? 0)) * 100).toFixed(0)}%`}
    </text>
  )
}

export default function ChartRenderer({ type, data, palette = 'violet', xKey, yKeys, height = 200, compact = false }: ChartRendererProps) {
  const colors = palettes[palette] ?? palettes.violet
  const h = compact ? 110 : height

  if (!data || data.length === 0) {
    return (
      <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-xs)', fontSize: 12, fontStyle: 'italic' }}>
        Sin datos
      </div>
    )
  }

  const keys = yKeys ?? (Object.keys(data[0]).filter(k => k !== xKey && typeof data[0][k] === 'number').slice(0, 4))
  const xK = xKey ?? Object.keys(data[0])[0]

  const commonProps = {
    data,
    margin: { top: 4, right: 4, bottom: compact ? 0 : 16, left: compact ? -20 : 0 },
  }

  const axisStyle = { fontSize: compact ? 9 : 11, fill: 'var(--text-xs)', fontFamily: 'Inter, system-ui' }
  const tooltipStyle = {
    background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(200,210,230,0.6)',
    borderRadius: 8, fontSize: 12, fontFamily: 'Inter, system-ui',
    boxShadow: '0 4px 16px rgba(30,40,70,0.12)',
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,160,200,0.15)" vertical={false} />
          {!compact && <XAxis dataKey={xK} tick={axisStyle} axisLine={false} tickLine={false} />}
          {!compact && <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />}
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(124,111,224,0.06)' }} />
          {!compact && keys.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />}
          {keys.map((k, i) => (
            <Bar key={k} dataKey={k} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} maxBarSize={48} opacity={0.85} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,160,200,0.15)" vertical={false} />
          {!compact && <XAxis dataKey={xK} tick={axisStyle} axisLine={false} tickLine={false} />}
          {!compact && <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />}
          <Tooltip contentStyle={tooltipStyle} />
          {!compact && keys.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />}
          {keys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} strokeWidth={2.5}
              dot={false} activeDot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart {...commonProps}>
          <defs>
            {keys.map((k, i) => (
              <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,160,200,0.15)" vertical={false} />
          {!compact && <XAxis dataKey={xK} tick={axisStyle} axisLine={false} tickLine={false} />}
          {!compact && <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} />}
          <Tooltip contentStyle={tooltipStyle} />
          {!compact && keys.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />}
          {keys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k}
              stroke={colors[i % colors.length]} strokeWidth={2.5}
              fill={`url(#grad-${k})`} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'pie' || type === 'donut') {
    const pieData = keys.length > 0
      ? data.slice(0, 8).map(row => ({ name: String(row[xK] ?? ''), value: Number(row[keys[0]] ?? 0) }))
      : []
    const inner = type === 'donut' ? '50%' : '0%'
    return (
      <ResponsiveContainer width="100%" height={h}>
        <PieChart>
          <Pie
            data={pieData} cx="50%" cy="50%"
            innerRadius={inner} outerRadius="70%"
            dataKey="value" labelLine={false}
            label={compact ? undefined : renderCustomLabel}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} opacity={0.88} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
          {!compact && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />}
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'scatter') {
    const numKeys = Object.keys(data[0]).filter(k => typeof data[0][k] === 'number')
    const xK2 = numKeys[0] ?? xK
    const yK2 = numKeys[1] ?? numKeys[0]
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ScatterChart margin={commonProps.margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,160,200,0.15)" />
          {!compact && <XAxis dataKey={xK2} name={xK2} tick={axisStyle} axisLine={false} tickLine={false} />}
          {!compact && <YAxis dataKey={yK2} name={yK2} tick={axisStyle} axisLine={false} tickLine={false} width={36} />}
          <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data} fill={colors[0]} opacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  return null
}
