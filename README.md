# Aerodyne — Drone Ground Control Station

Built with **Tauri 1 + React 18 + Vite**. Mock-data only; ready to wire up to Isaac Sim via Tauri events or a WebSocket bridge.

---


## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| Rust + Cargo | stable (via [rustup](https://rustup.rs)) |
| Tauri CLI | installed below |

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Install Tauri CLI
npm install -g @tauri-apps/cli   # or: cargo install tauri-cli

# 3. Run in dev mode (hot-reload frontend + Rust backend)
npm run tauri dev

# 4. Build a native binary
npm run tauri build
```

The app launches **fullscreen** (configured in `tauri.conf.json`).

---

## Tauri backend commands

| Command               | Args                          | Returns           |
|---------              |------                         |---------          |
| `connect_drone`       | `drone_id: String`            | `CommandResult`   |
| `disconnect_drone`    | `drone_id: String`            | `CommandResult`   |
| `create_mission`      | `region: Vec<(f32,f32)>`      | `CommandResult` with mission JSON |
| `cancel_mission`      | `mission_id: String`          | `CommandResult`   |
| `get_telemetry`       | —                             | Mock telemetry array |

All commands return:

{ "success": true, "message": "...", "data": { ... } }


---

## Wiring up Isaac Sim

1. Replace `invoke('create_mission', ...)` in `MapView.jsx` with a Tauri event or WebSocket call to your ROS2/Isaac Sim bridge.
2. Subscribe to Isaac Sim telemetry events and update `drones` state in `App.jsx`.
3. Feed real LiDAR/Radar/RGB data into the canvas `draw*` functions in `FeedsPanel.jsx`.

---

## Customisation

- **Add a drone**: append an entry to `MOCK_DRONES` in `src/mockData.js`.
- **Change map area**: update `mapPos` (0–1 relative coordinates) per drone.
- **Add a timeline track**: edit `SEGS` in `MapView.jsx`.
- **Add a tab view**: extend `DEFAULT_TABS` in `TabBar.jsx` and render conditionally in `App.jsx`.
