'use client'

import { useState } from 'react'
import Sidebar from './ui/Sidebar'
import DataHub from './DataHub'
import DashboardBuilder from './DashboardBuilder'
import WorkspacesScreen from './WorkspacesScreen'
import ShareModal from './ShareModal'

type Screen = 'hub' | 'dashboard' | 'workspaces'

interface AppShellProps {
  userId: string
  userEmail: string
}

export default function AppShell({ userId, userEmail }: AppShellProps) {
  const [screen, setScreen]           = useState<Screen>('hub')
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [datasetId, setDatasetId]     = useState<string>('')
  const [showShare, setShowShare]     = useState(false)

  const handleConnect = (wsId: string, dsId: string) => {
    setWorkspaceId(wsId)
    setDatasetId(dsId)
    setScreen('dashboard')
  }

  const handleOpenWorkspace = (wsId: string, dsId?: string) => {
    setWorkspaceId(wsId)
    if (dsId) setDatasetId(dsId)
    if (dsId) setScreen('dashboard')
    else setScreen('hub')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar screen={screen} setScreen={setScreen} userEmail={userEmail} />

      {screen === 'hub' && (
        <DataHub userId={userId} onConnect={handleConnect} />
      )}

      {screen === 'dashboard' && workspaceId && datasetId && (
        <DashboardBuilder
          workspaceId={workspaceId}
          datasetId={datasetId}
          userId={userId}
          onShare={() => setShowShare(true)}
        />
      )}

      {screen === 'dashboard' && (!workspaceId || !datasetId) && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', fontFamily: 'var(--font-plus-jakarta)', fontWeight: 600 }}>
            Primero conecta un dataset desde el Data Hub.
          </p>
          <button onClick={() => setScreen('hub')} style={{ padding: '9px 20px', borderRadius: 8, background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-plus-jakarta)' }}>
            Ir al Data Hub
          </button>
        </div>
      )}

      {screen === 'workspaces' && (
        <WorkspacesScreen userId={userId} onOpen={handleOpenWorkspace} />
      )}

      {showShare && workspaceId && (
        <ShareModal workspaceId={workspaceId} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}
