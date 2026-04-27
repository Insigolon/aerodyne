// src/components/MapView.jsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'

export default function MapView({ drones }) {
  const canvasRef   = useRef(null)
  const tlCanvasRef = useRef(null)
  const animRef     = useRef(null)
  const sel         = useRef({ start: null, end: null, dragging: false })

  const [missions, setMissions]   = useState([])
  const [toast, setToast]         = useState(false)

  // ── Draw map ─────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const c = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    c.clearRect(0, 0, W, H)
    c.fillStyle = '#080c12'; c.fillRect(0, 0, W, H)

    // Minor grid
    c.strokeStyle = 'rgba(26,36,50,0.9)'; c.lineWidth = 0.5
    for (let x = 0; x < W; x += 30) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke() }
    for (let y = 0; y < H; y += 30) { c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke() }

    // Major grid
    c.strokeStyle = 'rgba(0,229,255,0.05)'; c.lineWidth = 1
    for (let x = 0; x < W; x += 150) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke() }
    for (let y = 0; y < H; y += 150) { c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke() }

    // Terrain blobs
    const blobs = [
      {x:.2,y:.3,r:70,a:.45},{x:.7,y:.4,r:90,a:.38},
      {x:.5,y:.7,r:55,a:.32},{x:.85,y:.2,r:60,a:.28},
    ]
    blobs.forEach(b => {
      const g = c.createRadialGradient(b.x*W,b.y*H,0,b.x*W,b.y*H,b.r)
      g.addColorStop(0, `rgba(20,45,30,${b.a})`); g.addColorStop(1, 'transparent')
      c.fillStyle = g; c.beginPath(); c.arc(b.x*W,b.y*H,b.r,0,Math.PI*2); c.fill()
    })

    // Mission regions
    missions.forEach((m, i) => {
      c.fillStyle   = 'rgba(124,77,255,0.07)'
      c.strokeStyle = 'rgba(124,77,255,0.45)'
      c.lineWidth   = 1; c.setLineDash([4,3])
      c.beginPath(); c.rect(m.x,m.y,m.w,m.h); c.fill(); c.stroke()
      c.setLineDash([])
      c.fillStyle = 'rgba(124,77,255,0.75)'
      c.font = '9px monospace'
      c.fillText(`MISSION ${i+1}`, m.x+5, m.y+13)
    })

    // Active selection
    const { start, end, dragging } = sel.current
    if (start && end) {
      const sx = Math.min(start.x, end.x), sy = Math.min(start.y, end.y)
      const sw = Math.abs(end.x - start.x), sh = Math.abs(end.y - start.y)
      c.fillStyle   = 'rgba(0,229,255,0.06)'
      c.strokeStyle = dragging ? 'rgba(0,229,255,0.8)' : 'rgba(0,229,255,0.45)'
      c.lineWidth   = 1.5; c.setLineDash([5,3])
      c.beginPath(); c.rect(sx,sy,sw,sh); c.fill(); c.stroke()
      c.setLineDash([])
      // Corner marks
      c.strokeStyle = 'rgba(0,229,255,0.9)'; c.lineWidth = 2
      [[sx,sy],[sx+sw,sy],[sx,sy+sh],[sx+sw,sy+sh]].forEach(([cx,cy]) => {
        c.beginPath(); c.moveTo(cx-6,cy); c.lineTo(cx+6,cy); c.stroke()
        c.beginPath(); c.moveTo(cx,cy-6); c.lineTo(cx,cy+6); c.stroke()
      })
      if (sw > 30 && sh > 30) {
        c.fillStyle = 'rgba(0,229,255,0.65)'; c.font = '9px monospace'
        c.fillText(`${Math.round(sw)}×${Math.round(sh)} m`, sx+4, sy-4)
      }
    }

    // Drone trails + markers
    drones.forEach(d => {
      const x = d.mapPos.x * W, y = d.mapPos.y * H
      const col = d.connected ? d.color : 'rgba(255,255,255,0.18)'

      if (d.connected) {
        // Pulse ring
        const t = Date.now() / 1000
        const pr = 10 + 12 * ((Math.sin(t * 2 + d.mapPos.x * 9) * 0.5 + 0.5))
        c.beginPath(); c.arc(x, y, pr, 0, Math.PI*2)
        c.strokeStyle = col; c.lineWidth = 0.8
        c.globalAlpha = 0.28 * (1 - (pr-10)/12); c.stroke(); c.globalAlpha = 1

        // Trail
        c.strokeStyle = col; c.lineWidth = 0.8; c.globalAlpha = 0.25
        c.setLineDash([3,4])
        c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+28,y-18,x+55,y-38); c.stroke()
        c.setLineDash([]); c.globalAlpha = 1
      }

      // Drone cross
      c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 1.5
      ;[[-6,0],[6,0],[0,-6],[0,6]].forEach(([dx,dy]) => {
        c.beginPath(); c.arc(x+dx,y+dy,2.8,0,Math.PI*2); c.fill()
      })
      c.beginPath(); c.moveTo(x-6,y-6); c.lineTo(x+6,y+6); c.stroke()
      c.beginPath(); c.moveTo(x+6,y-6); c.lineTo(x-6,y+6); c.stroke()
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x,y,1.8,0,Math.PI*2); c.fill()

      // Labels
      c.fillStyle = col; c.font = 'bold 9px monospace'
      c.fillText(d.id, x+12, y-8)
      c.fillStyle = d.connected ? 'rgba(255,255,255,0.45)' : '#ff4444'
      c.font = '8px monospace'
      c.fillText(d.connected ? `${d.altitude.toFixed(0)}m · ${d.velocity.toFixed(1)}m/s` : 'OFFLINE', x+12, y+3)
    })

    // Coord labels
    c.fillStyle = 'rgba(0,229,255,0.22)'; c.font = '8px monospace'
    for (let gx = 0; gx < W; gx += 150) c.fillText((gx/W*100).toFixed(0), gx+2, 10)
  }, [drones, missions])

  // ── Draw timeline ─────────────────────────────────────────────────
  const drawTimeline = useCallback(() => {
    const canvas = tlCanvasRef.current
    if (!canvas) return
    const c = canvas.getContext('2d')
    const W = canvas.width, H = 72
    c.clearRect(0,0,W,H)
    c.fillStyle = '#0d1018'; c.fillRect(0,0,W,H)

    c.fillStyle = 'rgba(0,229,255,0.7)'; c.font = 'bold 9px monospace'
    c.fillText('TIMELINE', 8, 14)

    const labelW = 70, rowH = 14, rowPad = 4, startY = 22, totalDur = 540
    const tlW = W - labelW - 12

    // Tick marks
    c.fillStyle = 'rgba(255,255,255,0.14)'; c.font = '8px monospace'
    for (let t = 0; t <= totalDur; t += 60) {
      const x = labelW + (t/totalDur)*tlW
      c.fillRect(x, startY-4, 0.5, H-startY+4)
      const mm = Math.floor(t/60), ss = t%60
      c.fillText(`${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`, x-12, startY-6)
    }

    // Playhead
    const now = (Date.now()/1000) % totalDur
    c.fillStyle = 'rgba(255,80,80,0.8)'
    c.fillRect(labelW + (now/totalDur)*tlW, startY, 1, H-startY)

    // Bars
    const SEGS = [
      { id:'Drone_01', color:'#00e5ff', segs:[[0,.65]] },
      { id:'Drone_02', color:'#7c4dff', segs:[[0,1.0]] },
      { id:'Drone_03', color:'#ffab00', segs:[[0,.28],[.32,.45]] },
    ]
    SEGS.forEach((s, i) => {
      const y = startY + 4 + i*(rowH+rowPad)
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(labelW,y,tlW,rowH-2)
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.font = '8px monospace'; c.fillText(s.id, 4, y+rowH-3)
      s.segs.forEach(([a,b]) => {
        c.fillStyle = s.color+'66'; c.fillRect(labelW+a*tlW, y, (b-a)*tlW, rowH-2)
        c.fillStyle = s.color
        c.fillRect(labelW+a*tlW, y, 1, rowH-2)
        c.fillRect(labelW+b*tlW-1, y, 1, rowH-2)
      })
    })
  }, [])

  // ── Resize + animation loop ───────────────────────────────────────
  useEffect(() => {
    function resize() {
      const mc = canvasRef.current, tl = tlCanvasRef.current
      if (!mc || !tl) return
      const wrap = mc.parentElement
      mc.width  = wrap.offsetWidth
      mc.height = wrap.offsetHeight
      tl.width  = wrap.offsetWidth
    }
    resize()
    window.addEventListener('resize', resize)

    let tlId = setInterval(drawTimeline, 500)

    function loop() { draw(); animRef.current = requestAnimationFrame(loop) }
    loop()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
      clearInterval(tlId)
    }
  }, [draw, drawTimeline])

  // ── Mouse handlers ────────────────────────────────────────────────
  const onMouseDown = e => {
    const r = canvasRef.current.getBoundingClientRect()
    sel.current = { start: { x: e.clientX-r.left, y: e.clientY-r.top }, end: null, dragging: true }
  }
  const onMouseMove = e => {
    if (!sel.current.dragging) return
    const r = canvasRef.current.getBoundingClientRect()
    sel.current.end = { x: e.clientX-r.left, y: e.clientY-r.top }
  }
  const onMouseUp = () => { sel.current.dragging = false }

  // ── Create mission ────────────────────────────────────────────────
  const createMission = async () => {
    const { start, end } = sel.current
    if (!start || !end) return
    const sx = Math.min(start.x, end.x), sy = Math.min(start.y, end.y)
    const sw = Math.abs(end.x - start.x), sh = Math.abs(end.y - start.y)
    if (sw < 20 || sh < 20) { alert('Select a larger region first'); return }

    const region = [
      [sx, sy], [sx+sw, sy], [sx+sw, sy+sh], [sx, sy+sh],
    ]

    try {
      const result = await invoke('create_mission', { region })
      console.log('[GCS] Mission result:', result)
    } catch (err) {
      console.warn('[GCS] Tauri not available (dev mode), mock mission created:', err.message)
    }

    setMissions(prev => [...prev, { x: sx, y: sy, w: sw, h: sh }])
    sel.current = { start: null, end: null, dragging: false }
    setToast(true)
    setTimeout(() => setToast(false), 2200)
  }

  return (
    <div className="panel-center">
      {/* MAP */}
      <div className="map-area">
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        />
        {toast && (
          <div className="mission-toast">✓ MISSION CREATED — QUEUED FOR DISPATCH</div>
        )}
        <div className="map-toolbar">
          <button className="map-btn primary" onClick={createMission}>+ CREATE MISSION</button>
          <button className="map-btn" onClick={() => { setMissions([]); sel.current={start:null,end:null,dragging:false} }}>CLEAR</button>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="timeline">
        <canvas ref={tlCanvasRef} height={72} />
      </div>
    </div>
  )
}