import { useState, useEffect } from 'react'
import FeedsPanel from './components/FeedsPanel'
import MapView    from './components/MapView'
import DronePanel from './components/DronePanel'
import TabBar     from './components/TabBar'
import { MOCK_DRONES } from './mockData'

export default function App() {
  const [drones, setDrones]       = useState(MOCK_DRONES)
  const [activeTab, setActiveTab] = useState('Feeds')
  const [clock, setClock]         = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toTimeString().slice(0, 8) + ' UTC')
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const toggleDrone = id =>
    setDrones(prev =>
      prev.map(d => d.id === id ? { ...d, connected: !d.connected } : d)
    )

  const connectedCount = drones.filter(d => d.connected).length

  return (
    <div className="gcs-root">
      <div className="statusbar">
        <span className="logo">◆ AERODYNE GCS</span>
        <span className="status-chip"><span className="dot green" />SYS NOMINAL</span>
        <span className="status-chip"><span className="dot green" />ISAAC SIM 4.2</span>
        <span className="status-chip">
          <span className="dot" style={{ background: connectedCount > 0 ? '#ffab00' : '#ff4444', boxShadow: `0 0 5px ${connectedCount > 0 ? '#ffab00' : '#ff4444'}` }} />
          {connectedCount}/{drones.length} DRONES
        </span>
        <span className="clock">{clock}</span>
      </div>

      <div className="main-area">
        <div className="panel-left">
          <FeedsPanel />
        </div>
        <div className="panel-center">
          <MapView drones={drones} />
        </div>
        <div className="panel-right">
          <DronePanel drones={drones} onToggleDrone={toggleDrone} />
        </div>
      </div>

      <TabBar activeTab={activeTab} onSwitch={setActiveTab} />
    </div>
  )
}