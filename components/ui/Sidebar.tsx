'use client'

import { useRouter } from 'next/navigation'
import { Database, LayoutDashboard, Users, Settings, Zap, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Screen = 'hub' | 'dashboard' | 'workspaces'

const navItems = [
  { id: 'hub' as Screen,        label: 'Data Hub',    Icon: Database },
  { id: 'dashboard' as Screen,  label: 'Dashboard',   Icon: LayoutDashboard },
  { id: 'workspaces' as Screen, label: 'Workspaces',  Icon: Users },
]

interface SidebarProps {
  screen: Screen
  setScreen: (s: Screen) => void
  userEmail: string
}

function UserAvatar({ email, size = 32 }: { email: string; size?: number }) {
  const initials = email.includes('@')
    ? email.split('@')[0].slice(0, 2).toUpperCase()
    : 'BI'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, color: 'white',
      fontFamily: 'var(--font-plus-jakarta)',
      border: '2px solid rgba(255,255,255,0.15)',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export default function Sidebar({ screen, setScreen, userEmail }: SidebarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

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
              e.currentTarget.style.background = 'var(--sidebar-hover)'
              e.currentTarget.style.color = 'rgba(200,205,240,1)'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = screen === id ? 'var(--sidebar-active)' : 'transparent'
            e.currentTarget.style.color = screen === id ? 'white' : 'rgba(150,155,190,1)'
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

      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        style={{
          width: 38, height: 38, border: 'none', cursor: 'pointer',
          borderRadius: 8, background: 'transparent',
          color: 'rgba(100,105,140,1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.15)'; e.currentTarget.style.color = '#F87171' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(100,105,140,1)' }}
      >
        <LogOut size={15} />
      </button>

      <UserAvatar email={userEmail} size={32} />
      <div style={{ height: 8 }} />
    </aside>
  )
}
