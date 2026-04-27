// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

// ─── Shared types ────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

impl CommandResult {
    fn ok(msg: impl Into<String>) -> Self {
        Self { success: true, message: msg.into(), data: None }
    }
    fn ok_with(msg: impl Into<String>, data: serde_json::Value) -> Self {
        Self { success: true, message: msg.into(), data: Some(data) }
    }
    fn err(msg: impl Into<String>) -> Self {
        Self { success: false, message: msg.into(), data: None }
    }
}

// ─── Drone commands ──────────────────────────────────────────────────────────

/// Connect a drone by ID.
/// In production this would open a UDP/ROS2 socket.
#[tauri::command]
fn connect_drone(drone_id: String) -> CommandResult {
    if drone_id.trim().is_empty() {
        return CommandResult::err("drone_id cannot be empty");
    }
    println!("[GCS] Connecting to drone: {}", drone_id);
    CommandResult::ok_with(
        format!("Drone '{}' connected successfully", drone_id),
        serde_json::json!({ "drone_id": drone_id, "status": "connected", "timestamp": chrono_now() }),
    )
}

/// Disconnect a drone by ID.
#[tauri::command]
fn disconnect_drone(drone_id: String) -> CommandResult {
    if drone_id.trim().is_empty() {
        return CommandResult::err("drone_id cannot be empty");
    }
    println!("[GCS] Disconnecting drone: {}", drone_id);
    CommandResult::ok_with(
        format!("Drone '{}' disconnected", drone_id),
        serde_json::json!({ "drone_id": drone_id, "status": "disconnected", "timestamp": chrono_now() }),
    )
}

// ─── Mission commands ────────────────────────────────────────────────────────

/// Region is a list of (x, y) corner points in map-space coordinates.
/// For a rectangle: [(x0,y0), (x1,y0), (x1,y1), (x0,y1)]
#[tauri::command]
fn create_mission(region: Vec<(f32, f32)>) -> CommandResult {
    if region.len() < 3 {
        return CommandResult::err("Region must have at least 3 points");
    }

    // Compute bounding box and area for logging
    let xs: Vec<f32> = region.iter().map(|p| p.0).collect();
    let ys: Vec<f32> = region.iter().map(|p| p.1).collect();
    let x_min = xs.iter().cloned().fold(f32::INFINITY, f32::min);
    let x_max = xs.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
    let y_min = ys.iter().cloned().fold(f32::INFINITY, f32::min);
    let y_max = ys.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
    let area = (x_max - x_min) * (y_max - y_min);

    println!(
        "[GCS] Mission created — points: {}, bbox: ({:.1},{:.1})->({:.1},{:.1}), area: {:.1} m²",
        region.len(), x_min, y_min, x_max, y_max, area
    );

    CommandResult::ok_with(
        "Mission created and queued for Isaac Sim dispatch",
        serde_json::json!({
            "mission_id": format!("MSN-{:04}", rand_id()),
            "region": region,
            "bbox": { "x_min": x_min, "y_min": y_min, "x_max": x_max, "y_max": y_max },
            "area_m2": area,
            "status": "queued",
            "timestamp": chrono_now(),
        }),
    )
}

/// Cancel a running mission by mission ID.
#[tauri::command]
fn cancel_mission(mission_id: String) -> CommandResult {
    println!("[GCS] Cancelling mission: {}", mission_id);
    CommandResult::ok(format!("Mission '{}' cancelled", mission_id))
}

/// Return mock telemetry for all connected drones.
#[tauri::command]
fn get_telemetry() -> CommandResult {
    let data = serde_json::json!([
        { "id": "Drone_01", "altitude": 42.3, "velocity": 8.3, "direction": 354, "battery": 74, "connected": true },
        { "id": "Drone_02", "altitude": 38.1, "velocity": 6.1, "direction": 127, "battery": 61, "connected": true },
        { "id": "Drone_03", "altitude": 120.5,"velocity": 24.7,"direction": 210, "battery": 88, "connected": false },
    ]);
    CommandResult::ok_with("Telemetry fetched", data)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

fn chrono_now() -> String {
    // Simple mock; replace with chrono::Utc::now() if you add the chrono crate
    "2025-01-01T00:00:00Z".to_string()
}

fn rand_id() -> u16 {
    // Replace with a real random or atomic counter in production
    42
}

// ─── Entry point ─────────────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            connect_drone,
            disconnect_drone,
            create_mission,
            cancel_mission,
            get_telemetry,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aerodyne GCS");
}