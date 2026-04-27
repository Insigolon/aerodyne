// src/components/DronePanel.jsx
import { invoke } from '@tauri-apps/api/tauri'
import { MOCK_LOG_FILES } from '../mockData'

// ── Single drone stat card ───────────────────────────────────────────
function DroneCard({ drone, onToggle }) {
  const { id, type, encrypt, battery, altitude, velocity, direction, connected, color } = drone

  const handleToggle = async () => {
    try {
      const cmd    = connected ? 'disconnect_drone' : 'connect_drone'
      const result = await invoke(cmd, { droneId: id })
      console.log('[GCS]', result)
    } catch (err) {
      console.warn('[GCS] Tauri not available, toggling mock state:', err.message)
    }
    onToggle(id)
  }

  const batColor = battery > 30 ? 'var(--success)' : 'var(--danger)'

  return (
    <div className="drone-card">
      <div className="drone-card-head">
        <div>
          <div className="drone-id" style={{ color }}>{id}</div>
          <div className="drone-meta">{type} · {encrypt}</div>
        </div>
        <button
          className={`conn-btn ${connected ? 'on' : 'off'}`}
          onClick={handleToggle}
        >
          {connected ? 'DISC' : 'CONN'}
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-cell">
          <div className="stat-key">Alt</div>
          <div className="stat-val" style={{ color }}>{altitude.toFixed(0)}m</div>
        </div>
        <div className="stat-cell">
          <div className="stat-key">Vel</div>
          <div className="stat-val">{velocity.toFixed(1)} m/s</div>
        </div>
        <div className="stat-cell">
          <div className="stat-key">Dir</div>
          <div className="stat-val">{direction}°</div>
        </div>
        <div className="stat-cell">
          <div className="stat-key">Bat</div>
          <div className="stat-val" style={{ color: batColor }}>{battery}%</div>
        </div>
      </div>

      <div className="bat-bar">
        <div className="bat-fill" style={{ width: `${battery}%`, background: batColor }} />
      </div>
    </div>
  )
}

// ── Log file thumbnail ───────────────────────────────────────────────
function LogThumb({ file }) {
  return (
    <div className="log-thumb" title={`${file.name} — ${file.size}`}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="2" width="12" height="14" rx="2" stroke="rgba(255,255,255,0.22)" strokeWidth="1"/>
        <rect x="5" y="5"  width="8" height="1" fill="rgba(255,255,255,0.18)"/>
        <rect x="5" y="7.5" width="6" height="1" fill="rgba(255,255,255,0.12)"/>
        <rect x="5" y="10" width="7" height="1" fill="rgba(255,255,255,0.12)"/>
      </svg>
      <div className="log-name">{file.name}</div>
    </div>
  )
}

// ── DronePanel ───────────────────────────────────────────────────────
export default function DronePanel({ drones, onToggleDrone }) {
  return (
    <div className="panel-right">
      <div className="panel-title">◼ Drone Stats</div>

      {drones.map(d => (
        <DroneCard key={d.id} drone={d} onToggle={onToggleDrone} />
      ))}

      <div className="log-section">
        <div className="panel-title" style={{ padding: '0 0 6px', border: 'none', marginBottom: 0 }}>
          Log Files
        </div>
        <div className="log-grid">
          {MOCK_LOG_FILES.map(f => <LogThumb key={f.id} file={f} />)}
        </div>
      </div>

      {/* Connected drones summary */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
        <div className="panel-title" style={{ padding: 0, border: 'none', marginBottom: 8 }}>
          Connected
        </div>
        {drones.map(d => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: 9, color: 'var(--muted)', letterSpacing: '.06em' }}>
            <span className="dot" style={{ background: d.connected ? 'var(--success)' : 'var(--danger)' }} />
            <span style={{ color: d.color, fontWeight: 700 }}>{d.id}</span>
            <span>{d.type}</span>
            <span style={{ marginLeft: 'auto' }}>{d.encrypt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}