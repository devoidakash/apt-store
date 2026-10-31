use crate::types::{Repository, UpdateError};
use std::process::Command;

#[tauri::command]
pub async fn update_packages(repository: Repository) -> Result<(), UpdateError> {
    tauri::async_runtime::spawn_blocking(move || process_update(repository))
        .await
        .unwrap_or_else(|e| {
            eprintln!("[update_packages] Failed to execute update in background: {e}");
            Err(UpdateError::BackgroundTaskFailed)
        })
}

fn process_update(repository: Repository) -> Result<(), UpdateError> {
    let repository_json = serde_json::to_string(&repository).map_err(|e| {
        eprintln!("[process_update] Failed to serialize repository: {e}");
        UpdateError::InvalidInput
    })?;

    let status = Command::new("pkexec")
        .arg(helper_path())
        .arg("update")
        .arg(repository_json)
        .status()
        .map_err(|e| {
            eprintln!("[process_update] Failed to execute pkexec: {e}");
            UpdateError::PrivilegeEscalationFailed
        })?;

    if status.code() == Some(126) {
        eprintln!("[process_update] Update cancelled by user");
        return Err(UpdateError::Cancelled);
    }

    if !status.success() {
        eprintln!(
            "[process_update] Update helper failed. Exit code: {:?}",
            status.code()
        );
        return Err(UpdateError::UpdateFailed);
    }

    Ok(())
}

fn helper_path() -> std::path::PathBuf {
    std::env::current_dir()
        .expect("Failed to get current directory")
        .join("target/debug/helper")
}
