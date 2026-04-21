'use client'

import { useState, useCallback } from 'react'
import { Upload, Link2, Folder, Check, Sparkles, Database, ChevronRight } from 'lucide-react'
import { parseFile } from '@/lib/parse'
import { createClient } from '@/lib/supabase/client'
import type { ParseResult } from '@/lib/parse'

const integrations = [
  { name: 'SAP',              color: '#009DE0', symbol: 'SAP' },
  { name: 'Google Analytics', color: '#E37400', symbol: 'GA'  },
  { name: 'SQL Server',       color: '#4479A1', symbol: 'SQL' },
  { name: 'Salesforce',       color: '#00A1E0', symbol: 'SF'  },
]

const recentFiles = [
  { name: 'kpis_2025.xlsx',   rows: '1,200 filas', date: 'Hace 2 días' },
  { name: 'clientes_crm.csv', rows: '8,440 filas', date: 'Hace 5 días' },
]

interface DataHubProps {
  onConnect: (workspaceId: string, datasetId: string) => void
}

export default function DataHub({ onConnect }: DataHubProps) {
  const [dragOver, setDragOver]       = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [parsed, setParsed]           = useState<ParseResult | null>(null)
  const [fileName, setFileName]       = useState('')
  const [error, setError]             = useState('')
  const [connectedInt, setConnectedInt] = useState<string | null>(null)
  const [connecting, setConnecting]   = useState<string | null>(null)

  const supabase = createClient()

  const handleFile = useCallback(async (file: File) => {
    setError('')
    setUploading(true)
    setFileName(file.name)
    try {
      const result = await parseFile(file)
      setParsed(result)

      // 1. Create workspace
      const { data: ws, error: wsErr } = await supabase
        .from('workspaces')
        .insert({ name: `Análisis — ${file.name}`, status: 'live', owner_id: '00000000-0000-0000-0000-000000000001' })
        .select()
        .single()
      if (wsErr) throw wsErr

      // 2. Create dataset metadata
      const { data: ds, error: dsErr } = await supabase
        .from('datasets')
        .insert({
          workspace_id: ws.id,
          name: file.name.replace(/\.[^.]+$/, ''),
          original_filename: file.name,
          row_count: result.rowCount,
          column_count: result.columnCount,
          columns: result.columns,
          storage_path: '',
        })
        .select()
        .single()
      if (dsErr) throw dsErr

      // 3. Insert rows in batches of 500
      const BATCH = 500
      for (let i = 0; i < result.rows.length; i += BATCH) {
        const batch = result.rows.slice(i, i + BATCH).map((row, j) => ({
          dataset_id: ds.id,
          row_index: i + j,
          data: row,
        }))
        const { error: rowErr } = await supabase.from('dataset_rows').insert(batch)
        if (rowErr) throw rowErr
      }

      setTimeout(() => onConnect(ws.id, ds.id), 1200)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al procesar el archivo')
      setUploading(false)
    }
  }, [supabase, onConnect])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleConnectInt = (name: string) => {
    setConnecting(name)
    setTimeout(() => { setConnecting(null); setConnectedInt(name) }, 1600)
  }

  const uploaded = !!parsed

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={14} color="var(--accent)" />
          </div>
          <span style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Data Source Hub</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8, lineHeight: 1.2 }}>
          Conecta tus fuentes de datos
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 460, lineHeight: 1.6 }}>
          Carga un archivo o conecta tus herramientas. La IA detectará la estructura automáticamente.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 860 }}>
        {/* Upload card */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Upload size={16} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 14, fontWeight: 700, color: '#111827' }}>Cargar Archivo</span>
          </div>

          <label
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              border: `2px dashed ${dragOver ? 'var(--accent)' : uploaded ? 'var(--green)' : 'var(--border-soft)'}`,
              borderRadius: 'var(--radius)', padding: '32px 20px',
              cursor: uploading ? 'default' : 'pointer',
              background: dragOver ? 'var(--accent-dim)' : uploaded ? 'var(--green-dim)' : 'rgba(248,249,255,0.8)',
              transition: 'all 0.2s',
            }}
          >
            {uploading && !uploaded && (
              <>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 20, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Procesando {fileName}…</span>
              </>
            )}
            {uploaded && (
              <>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={20} color="var(--green)" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{fileName} — listo</span>
                <span style={{ fontSize: 11, color: 'var(--text-xs)' }}>{parsed.rowCount.toLocaleString()} filas · {parsed.columnCount} columnas detectadas</span>
              </>
            )}
            {!uploading && !uploaded && (
              <>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={22} color="var(--accent)" strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>Arrastra tu archivo aquí</span>
                <span style={{ fontSize: 11, color: 'var(--text-xs)' }}>CSV, Excel — hasta 100 MB</span>
                <span style={{ marginTop: 4, padding: '6px 16px', borderRadius: 99, border: '1px solid var(--border-soft)', fontSize: 11, color: 'var(--text-muted)', background: 'white', fontWeight: 500 }}>
                  o haz clic para explorar
                </span>
              </>
            )}
            <input type="file" accept=".csv,.xlsx,.xls" onChange={onInputChange} style={{ display: 'none' }} />
          </label>

          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, color: '#DC2626' }}>
              {error}
            </div>
          )}

          {uploaded && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'var(--green-dim)', border: '1px solid rgba(52,201,138,0.25)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Sparkles size={14} color="var(--green)" strokeWidth={1.8} style={{ marginTop: 1, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 2 }}>IA analizando estructura…</div>
                <div style={{ fontSize: 11, color: '#059669' }}>
                  Columnas detectadas: {parsed.columns.slice(0, 5).join(', ')}{parsed.columns.length > 5 ? ` y ${parsed.columns.length - 5} más` : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Integrations card */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Link2 size={16} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-plus-jakarta)', fontSize: 14, fontWeight: 700, color: '#111827' }}>Conectar Integración</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {integrations.map(int => (
              <button key={int.name} onClick={() => handleConnectInt(int.name)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 8,
                border: `1px solid ${connectedInt === int.name ? 'var(--green)' : 'rgba(200,210,230,0.6)'}`,
                background: connectedInt === int.name ? 'var(--green-dim)' : 'rgba(248,249,255,0.8)',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: int.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: int.color, letterSpacing: '-0.02em', fontFamily: 'var(--font-plus-jakarta)' }}>{int.symbol}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1f2937', flex: 1 }}>{int.name}</span>
                {connecting === int.name && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>Conectando…</span>}
                {connectedInt === int.name && <Check size={14} color="var(--green)" strokeWidth={2.5} />}
                {connecting !== int.name && connectedInt !== int.name && <ChevronRight size={14} color="var(--text-xs)" />}
              </button>
            ))}
          </div>
          <p style={{ marginTop: 14, fontSize: 11, color: 'var(--text-xs)', lineHeight: 1.5 }}>
            Las integraciones nativas estarán disponibles próximamente. Por ahora usa CSV o Excel.
          </p>
        </div>
      </div>

      {/* Recent files */}
      <div style={{ marginTop: 36, maxWidth: 860 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Fuentes recientes</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {recentFiles.map(f => (
            <div key={f.name} style={{
              background: 'var(--surface)', padding: '14px 18px', borderRadius: 12,
              border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer', boxShadow: 'var(--shadow-sm)', flex: '0 0 auto',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(124,111,224,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Folder size={16} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 2 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-xs)' }}>{f.rows} · {f.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
