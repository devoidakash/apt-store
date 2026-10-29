use crate::types::{InstallError, Repository};
use std::process::Command;

#[tauri::command]
pub async fn update_packages(repository: Repository) -> Result<(), InstallError> {
    tauri::async_runtime::spawn_blocking(move || process_update(repository))
        .await
        .unwrap_or_else(|e| {
            eprintln!("[update_packages] Failed to execute update in background: {e}");
            Err(InstallError::PackageInstallFailed)
        })
}

fn process_update(repository: Repository) -> Result<(), InstallError> {
    let repository_json =
        serde_json::to_string(&repository).map_err(|_| InstallError::InvalidInput)?;

    let status = Command::new("pkexec")
        .arg(helper_path())
        .arg("update")
        .arg(repository_json)
        .status()
        .map_err(|_| InstallError::RepositorySetupFailed)?;

    if status.code() == Some(126) {
        return Err(InstallError::Cancelled);
    }

    if !status.success() {
        return Err(InstallError::RepositorySetupFailed);
    }

    Ok(())
}

fn helper_path() -> std::path::PathBuf {
    std::env::current_dir()
        .expect("Failed to get current directory")
        .join("target/debug/helper")
}
