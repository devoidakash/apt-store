use crate::types::{RemoveError, Repository};
use std::process::Command;

#[tauri::command]
pub async fn remove_packages(repository: Repository) -> Result<(), RemoveError> {
    tauri::async_runtime::spawn_blocking(move || process_remove(repository))
        .await
        .unwrap_or_else(|e| {
            eprintln!("[remove_packages] Failed to execute remove in background: {e}");
            Err(RemoveError::PackageRemovalFailed)
        })
}

fn process_remove(repository: Repository) -> Result<(), RemoveError> {
    let repository_json =
        serde_json::to_string(&repository).map_err(|_| RemoveError::InvalidInput)?;

    let status = Command::new("pkexec")
        .arg(helper_path())
        .arg("remove")
        .arg(repository_json)
        .status()
        .map_err(|_| RemoveError::PackageRemovalFailed)?;

    if status.code() == Some(126) {
        return Err(RemoveError::Cancelled);
    }

    if !status.success() {
        return Err(RemoveError::PackageRemovalFailed);
    }

    Ok(())
}

fn helper_path() -> std::path::PathBuf {
    std::env::current_dir()
        .expect("Failed to get current directory")
        .join("target/debug/helper")
}
