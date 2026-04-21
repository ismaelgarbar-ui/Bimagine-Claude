'use client'

import { useState } from 'react'
import { X, Link, Check } from 'lucide-react'
import Avatar from './ui/Avatar'
import { createClient } from '@/lib/supabase/client'

const avatarData = [
  { initials: 'MR', color: '#7C6FE0' },
  { initials: 'AL', color: '#34C98A' },
  { initials: 'PG', color: '#F5A623' },
]

interface ShareModalProps {
  workspaceId: string
  onClose: () => void
}

export default function ShareModal({ workspaceId, onClose }: ShareModalProps) {
  const [email, setEmail]   = useState('')
  const [perm, setPerm]     = useState<'viewer' | 'editor' | 'owner'>('viewer')
  const [members, setMembers] = useState([
    { email: 'maria@bimagine.io', role: 'Propietario', av: avatarData[0] },
  ])
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  const handleInvite = async () => {
    if (!email.includes('@')) return
    setSaving(true)
    await supabase.from('workspace_members').insert({
      workspace_id: workspaceId,
      email,
      role: perm,
    })
    setMembers(prev => [...prev, { email, role: perm === 'editor' ? 'Puede editar' : perm === 'owner' ? 'Administrador' : 'Puede ver', av: avatarData[prev.length % avatarData.length] }])
    setEmail('')
    setSaving(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,30,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: 18, padding: '28px', width: 440, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 16, fontWeight: 800, color: '#111827' }}>Compartir Workspace</span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Invite */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            style={{ flex: 1, padding: '9px 12px', border: '1px solid rgba(200,210,230,0.7)', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'Inter' }}
          />
          <select value={perm} onChange={e => setPerm(e.target.value as 'viewer' | 'editor' | 'owner')}
            style={{ padding: '9px 10px', border: '1px solid rgba(200,210,230,0.7)', borderRadius: 8, fontSize: 12, background: '#F9FAFB', fontFamily: 'Inter', cursor: 'pointer' }}>
            <option value="viewer">Puede ver</option>
            <option value="editor">Puede editar</option>
            <option value="owner">Administrador</option>
          </select>
          <button onClick={handleInvite} disabled={saving} style={{
            padding: '9px 14px', borderRadius: 8, background: 'var(--accent)', color: 'white',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-plus-jakarta)',
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? '…' : 'Invitar'}
          </button>
        </div>

        {/* Members */}
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Miembros ({members.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map(m => (
            <div key={m.email} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(200,210,230,0.35)' }}>
              <Avatar initials={m.av.initials} color={m.av.color} size={28} />
              <span style={{ flex: 1, fontSize: 13, color: '#1f2937' }}>{m.email}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: '#F3F4F6', padding: '3px 8px', borderRadius: 99 }}>{m.role}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
          <button onClick={copyLink} style={{
            flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(200,210,230,0.6)',
            background: 'white', fontSize: 13, cursor: 'pointer', color: copied ? 'var(--green)' : 'var(--text-muted)',
            fontFamily: 'Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {copied ? <><Check size={13} /> Copiado</> : <><Link size={13} /> Copiar enlace</>}
          </button>
          <button onClick={onClose} style={{
            flex: 1, padding: 10, borderRadius: 8, background: 'var(--accent)', color: 'white',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-plus-jakarta)',
          }}>
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
