'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AuthForm() {
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Correo o contraseña incorrectos.')
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Cuenta creada. Revisa tu correo para confirmar, o inicia sesión directamente si el proyecto tiene confirmación desactivada.')
      }
    }

    setLoading(false)
  }

  const initials = email.includes('@')
    ? email.split('@')[0].slice(0, 2).toUpperCase()
    : 'BI'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.62)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.65)',
        borderRadius: 24,
        padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(30,40,70,0.14), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,111,224,0.35)' }}>
            <Zap size={18} color="white" strokeWidth={2.2} />
          </div>
          <span style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Bimagine</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {mode === 'login' ? 'Accede a tus análisis e insights.' : 'Empieza a analizar tus datos con IA.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Correo electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="var(--text-xs)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                required
                style={{
                  width: '100%', padding: '11px 12px 11px 36px',
                  border: '1px solid rgba(200,210,230,0.7)',
                  borderRadius: 10, fontSize: 14, outline: 'none',
                  fontFamily: 'Inter, system-ui',
                  background: 'rgba(255,255,255,0.7)',
                  color: '#111827',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'rgba(200,210,230,0.7)'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--text-xs)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                required
                minLength={6}
                style={{
                  width: '100%', padding: '11px 12px 11px 36px',
                  border: '1px solid rgba(200,210,230,0.7)',
                  borderRadius: 10, fontSize: 14, outline: 'none',
                  fontFamily: 'Inter, system-ui',
                  background: 'rgba(255,255,255,0.7)',
                  color: '#111827',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'rgba(200,210,230,0.7)'}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: '#DC2626', lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--green-dim)', border: '1px solid rgba(52,201,138,0.3)', fontSize: 12, color: '#059669', lineHeight: 1.5 }}>
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              borderRadius: 10, background: loading ? 'rgba(124,111,224,0.7)' : 'var(--accent)',
              color: 'white', border: 'none', cursor: loading ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-plus-jakarta)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
              boxShadow: '0 4px 12px rgba(124,111,224,0.3)',
            }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Procesando…</>
              : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
            }
          </button>
        </form>

        {/* Toggle */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          {' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 700, fontSize: 13, fontFamily: 'Inter, system-ui' }}
          >
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </div>

        {/* Divider + demo note */}
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(200,210,230,0.35)', textAlign: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-xs)', lineHeight: 1.5 }}>
            Bimagine · BI Generativa con IA
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
