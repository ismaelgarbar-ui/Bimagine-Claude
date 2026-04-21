'use client'

import { Database, LayoutDashboard, Users, Settings, Zap } from 'lucide-react'
import Avatar from './Avatar'

type Screen = 'hub' | 'dashboard' | 'workspaces'

const navItems = [
  { id: 'hub' as Screen,        label: 'Data Hub',    Icon: Database },
  { id: 'dashboard' as Screen,  label: 'Dashboard',   Icon: LayoutDashboard },
  { id: 'workspaces' as Screen, label: 'Workspaces',  Icon: Users },
]

interface SidebarProps {
  screen: Screen
  setScreen: (s: Screen) => void
}

export default function Sidebar({ screen, setScreen }: SidebarProps) {
  return (
    <aside style={{
      width: 56, background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(28px) saturate(160%)',
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '16px 0', gap: 4, flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={16} color="white" strokeWidth={2.2} />
        </div>
      </div>

      {/* Nav */}
      {navItems.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setScreen(id)}
          title={label}
          style={{
            width: 38, height: 38, border: 'none', cursor: 'pointer',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: screen === id ? 'var(--sidebar-active)' : 'transparent',
            color: screen === id ? 'white' : 'rgba(150,155,190,1)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            if (screen !== id) {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,205,240,1)'
            }
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = screen === id ? 'var(--sidebar-active)' : 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = screen === id ? 'white' : 'rgba(150,155,190,1)'
          }}
        >
          <Icon size={17} />
        </button>
      ))}

      <div style={{ flex: 1 }} />

      <button
        title="Configuración"
        style={{
          width: 38, height: 38, border: 'none', cursor: 'pointer',
          borderRadius: 8, background: 'transparent',
          color: 'rgba(100,105,140,1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Settings size={16} />
      </button>
      <Avatar initials="MR" color="#7C6FE0" size={32} />
      <div style={{ height: 8 }} />
    </aside>
  )
}
