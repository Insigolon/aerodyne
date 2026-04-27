// src/mockData.js
// All mock data for Isaac Sim integration (replace with Tauri events in production)

export const MOCK_DRONES = [
  {
    id:        'Drone_01',
    type:      'QuadCopter',
    encrypt:   'wr4gVa',
    battery:   74,
    altitude:  42.3,
    velocity:  8.3,
    direction: 354,
    connected: true,
    color:     '#00e5ff',
    mapPos:    { x: 0.42, y: 0.38 },
  },
  {
    id:        'Drone_02',
    type:      'QuadCopter',
    encrypt:   'wr45Vs',
    battery:   61,
    altitude:  38.1,
    velocity:  6.1,
    direction: 127,
    connected: true,
    color:     '#7c4dff',
    mapPos:    { x: 0.58, y: 0.55 },
  },
  {
    id:        'Drone_03',
    type:      'FixedWing',
    encrypt:   'wr98Xk',
    battery:   88,
    altitude:  120.5,
    velocity:  24.7,
    direction: 210,
    connected: false,
    color:     '#ffab00',
    mapPos:    { x: 0.31, y: 0.62 },
  },
]

export const MOCK_LOG_FILES = Array.from({ length: 9 }, (_, i) => ({
  id:   i + 1,
  name: `Log_${String(i + 1).padStart(2, '0')}.mp4`,
  size: `${(Math.random() * 400 + 50).toFixed(0)} MB`,
  date: '2025-01-01',
}))

// Timeline segments: [start%, end%] of total mission duration
export const MOCK_TIMELINE = [
  { droneId: 'Drone_01', segments: [[0, 0.65]] },
  { droneId: 'Drone_02', segments: [[0, 1.00]] },
  { droneId: 'Drone_03', segments: [[0, 0.28], [0.32, 0.45]] },
]