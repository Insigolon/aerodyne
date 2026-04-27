// src/components/TabBar.jsx
import { useState } from 'react'

const DEFAULT_TABS = ['Feeds', 'Map', 'Missions', 'Connections']

export default function TabBar({ activeTab, onSwitch }) {
  const [tabs, setTabs]     = useState(DEFAULT_TABS)
  const [active, setActive] = useState(activeTab ?? 'Feeds')

  const switchTo = name => {
    setActive(name)
    onSwitch?.(name)
  }

  const addTab = () => {
    const name = `Tab ${tabs.length + 1}`
    setTabs(prev => [...prev, name])
    switchTo(name)
  }

  return (
    <div className="tabbar">
      {tabs.map(t => (
        <button
          key={t}
          className={`tab${active === t ? ' active' : ''}`}
          onClick={() => switchTo(t)}
        >
          {t}
        </button>
      ))}
      <button className="tab tab-add" onClick={addTab}>+</button>
    </div>
  )
}