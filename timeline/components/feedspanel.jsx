// src/components/FeedsPanel.jsx
import { useEffect, useRef } from 'react'

// ── LiDAR: rotating scan + point cloud ──────────────────────────────
function drawLidar(canvas) {
  const ctx  = canvas.getContext('2d')
  const W = canvas.width  = canvas.offsetWidth  || 176
  const H = canvas.height = canvas.offsetHeight || 80
  const cx = W / 2, cy = H / 2

  function frame() {
    ctx.fillStyle = '#040608'
    ctx.fillRect(0, 0, W, H)

    // Rings
    ;[15, 27, 39].forEach(r => {
      ctx.strokeStyle = 'rgba(0,229,255,0.1)'
      ctx.lineWidth   = 0.5
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
    })

    // Sweep cone
    const ang = (Date.now() / 700) % (Math.PI * 2)
    const grd = ctx.createConicGradient(ang - 0.5, cx, cy)
    grd.addColorStop(0,    'rgba(0,229,255,0)')
    grd.addColorStop(0.12, 'rgba(0,229,255,0.22)')
    grd.addColorStop(0.13, 'rgba(0,229,255,0)')
    ctx.fillStyle = grd
    ctx.beginPath(); ctx.arc(cx, cy, 41, 0, Math.PI * 2); ctx.fill()

    // Point cloud
    const pts = [[20,22],[W-30,30],[55,H-20],[W-20,H-18],[W/2-10,18],[28,H/2]]
    pts.forEach(([x, y]) => {
      ctx.fillStyle = 'rgba(0,229,255,0.85)'
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill()
    })

    ctx.fillStyle = 'rgba(0,229,255,0.5)'
    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill()
  }

  return setInterval(frame, 28)
}

// ── Radar: oscilloscope waveform ─────────────────────────────────────
function drawRadar(canvas) {
  const ctx = canvas.getContext('2d')
  const W   = canvas.width  = canvas.offsetWidth  || 176
  const H   = canvas.height = canvas.offsetHeight || 80
  let t = 0

  function frame() {
    ctx.fillStyle = 'rgba(4,6,8,0.72)'
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(255,171,0,0.07)'
    ctx.lineWidth   = 0.5
    for (let x = 0; x < W; x += 22) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
    for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }

    // Waveform
    ctx.strokeStyle = 'rgba(255,171,0,0.85)'
    ctx.lineWidth   = 1.2
    ctx.beginPath()
    for (let x = 0; x < W; x++) {
      const y = H/2 + 11*Math.sin((x/18)+t) + 5*Math.sin((x/7)-t*1.4) + 2.5*Math.sin((x/3.5)+t*2)
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
    t += 0.05
  }

  return setInterval(frame, 28)
}

// ── RGB Camera: synthetic aerial scene ──────────────────────────────
function drawRGB(canvas) {
  const ctx = canvas.getContext('2d')
  const W   = canvas.width  = canvas.offsetWidth  || 176
  const H   = canvas.height = canvas.offsetHeight || 80

  function frame() {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62)
    sky.addColorStop(0, '#08101e'); sky.addColorStop(1, '#122238')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)

    // Ground
    const gnd = ctx.createLinearGradient(0, H * 0.62, 0, H)
    gnd.addColorStop(0, '#182808'); gnd.addColorStop(1, '#0c1804')
    ctx.fillStyle = gnd; ctx.fillRect(0, H * 0.62, W, H)

    // Horizon
    ctx.strokeStyle = 'rgba(100,200,80,0.35)'; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(0, H * 0.62); ctx.lineTo(W, H * 0.62); ctx.stroke()

    // Moving drone silhouette
    const dt = Date.now() / 1800
    const dx = W * 0.25 + Math.sin(dt) * W * 0.28
    const dy = H * 0.32
    ctx.fillStyle   = 'rgba(255,255,255,0.6)'
    ctx.fillRect(dx - 5, dy - 0.5, 10, 1.5)
    ctx.fillRect(dx - 0.5, dy - 5, 1.5, 10)
    ctx.fillStyle   = 'rgba(0,229,255,0.9)'
    ctx.beginPath(); ctx.arc(dx, dy, 1.5, 0, Math.PI * 2); ctx.fill()

    // HUD brackets
    ctx.strokeStyle = 'rgba(0,229,255,0.22)'; ctx.lineWidth = 0.5
    ctx.strokeRect(5,  4,  40, 22)
    ctx.strokeRect(W - 45, 4, 40, 22)
    ctx.fillStyle   = 'rgba(0,229,255,0.45)'; ctx.font = '6px monospace'
    ctx.fillText('ALT 42m',    8,  13)
    ctx.fillText('CAM-01',  W - 42, 13)
    ctx.fillText('30FPS',      8,  22)
    ctx.fillText('RGB-HD',  W - 42, 22)
  }

  return setInterval(frame, 45)
}

// ── FeedsPanel component ─────────────────────────────────────────────
export default function FeedsPanel() {
  const lidarRef = useRef(null)
  const radarRef = useRef(null)
  const rgbRef   = useRef(null)

  useEffect(() => {
    const intervals = [
      drawLidar(lidarRef.current),
      drawRadar(radarRef.current),
      drawRGB(rgbRef.current),
    ]
    return () => intervals.forEach(clearInterval)
  }, [])

  const feeds = [
    { label: 'LiDAR',      dotColor: '#00e676', ref: lidarRef },
    { label: 'Radar',      dotColor: '#ffab00', ref: radarRef },
    { label: 'RGB Camera', dotColor: '#00e676', ref: rgbRef   },
  ]

  return (
    <div className="panel-left">
      <div className="panel-title">◼ Sensor Feeds</div>

      {feeds.map(f => (
        <div className="feed-card" key={f.label}>
          <div className="feed-label">
            <span className="dot" style={{ background: f.dotColor, boxShadow: `0 0 5px ${f.dotColor}` }} />
            {f.label}
          </div>
          <div className="feed-canvas-wrap">
            <canvas ref={f.ref} />
          </div>
        </div>
      ))}

      <div style={{ padding: '10px 12px', flex: 1 }}>
        <div style={{ fontSize: 9, color: 'var(--muted)', lineHeight: 1.9, letterSpacing: '.06em' }}>
          SIM: Isaac Sim 4.2<br />
          FREQ: 30 Hz<br />
          LIDAR PTS: 64k/frame<br />
          FOV: 360° horiz
        </div>
      </div>
    </div>
  )
}