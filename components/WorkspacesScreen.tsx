'use client'

import { useState, useEffect } from 'react'
import { Plus, BarChart2, Clock, Users } from 'lucide-react'
import Avatar from './ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import type { Workspace } from '@/lib/supabase/types'

const avatarData = [
  { initials: 'MR', color: '#7C6FE0' },
  { initials: 'AL', color: '#34C98A' },
]

const statusBadge: Record<string, { label: string; color: string }> = {
  live:    { label: 'Live',    color: '#34C98A' },
  draft:   { label: 'Borrador', color: '#F5A623' },
  private: { label: 'Privado', color: '#9CA3AF' },
}

interface WorkspacesScreenProps {
  onOpen: (workspaceId: string, datasetId?: string) => void
}

export default function WorkspacesScreen({ onOpen }: WorkspacesScreenProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('workspaces').select('*').order('updated_at', { ascending: false })
      setWorkspaces(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  const createWorkspace = async () => {
    setCreating(true)
    const name = `Workspace ${new Date().toLocaleDateString('es-ES')}`
    const { data } = await supabase
      .from('workspaces')
      .insert({ name, status: 'draft', owner_id: '00000000-0000-0000-0000-000000000001' })
      .select().single()
    if (data) setWorkspaces(prev => [data, ...prev])
    setCreating(false)
  }

  const openWorkspace = async (ws: Workspace) => {
    const { data: datasets } = await supabase.from('datasets').select('id').eq('workspace_id', ws.id).limit(1)
    onOpen(ws.id, datasets?.[0]?.id)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 28, fontWeight: 800, marginBottom: 6, color: '#111827' }}>Workspaces</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Todos tus espacios de análisis colaborativo</p>
        </div>
        <button onClick={createWorkspace} disabled={creating} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
          borderRadius: 8, background: 'var(--accent)', color: 'white', border: 'none',
          cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-plus-jakarta)',
          opacity: creating ? 0.7 : 1,
        }}>
          <Plus size={15} strokeWidth={2.5} />
          Nuevo Workspace
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cargando workspaces…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18, maxWidth: 900 }}>
          {workspaces.map(ws => {
            const badge = statusBadge[ws.status] ?? statusBadge.draft
            return (
              <div
                key={ws.id}
                onClick={() => openWorkspace(ws)}
                className="glass animate-fade-in-up"
                style={{ borderRadius: 18, padding: '22px', cursor: 'pointer', transition: 'all 0.22s' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(30,40,70,0.14), inset 0 1px 0 rgba(255,255,255,0.8)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
                }}
              >
                {/* Preview placeholder */}
                <div style={{
                  height: 80, marginBottom: 16, borderRadius: 12, background: 'repeating-linear-gradient(135deg, rgba(124,111,224,0.06), rgba(124,111,224,0.06) 6px, rgba(124,111,224,0.02) 6px, rgba(124,111,224,0.02) 14px)',
                  border: '1.5px dashed rgba(124,111,224,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BarChart2 size={24} color="rgba(124,111,224,0.3)" />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 14, fontWeight: 700, color: '#111827', flex: 1, marginRight: 8 }}>{ws.name}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700, color: badge.color, background: badge.color + '20', flexShrink: 0 }}>
                    {badge.label}
                  </span>
                </div>

                {ws.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{ws.description}</div>}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-xs)' }}>
                      <Clock size={10} />
                      {new Date(ws.updated_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    {avatarData.slice(0, 2).map((a, i) => (
                      <div key={i} style={{ marginLeft: i === 0 ? 0 : -6 }}>
                        <Avatar initials={a.initials} color={a.color} size={22} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add card */}
          <div
            onClick={createWorkspace}
            style={{
              borderRadius: 18, border: '2px dashed rgba(200,210,230,0.6)',
              padding: '22px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', minHeight: 180, color: 'var(--text-xs)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'
              ;(e.currentTarget as HTMLDivElement).style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(200,210,230,0.6)'
              ;(e.currentTarget as HTMLDivElement).style.color = 'var(--text-xs)'
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, border: '2px dashed currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-plus-jakarta)' }}>Nuevo workspace</span>
          </div>
        </div>
      )}
    </div>
  )
}
