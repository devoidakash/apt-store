use crate::types::{InstallError, Repository};
use std::process::Command;

#[tauri::command]
pub async fn install_packages(repository: Repository) -> Result<(), InstallError> {
    tauri::async_runtime::spawn_blocking(move || process_installation(&repository))
        .await
        .unwrap_or_else(|e| {
            eprintln!("[install_packages] Failed to execute installation in background: {e}");
            Err(InstallError::PackageInstallFailed)
        })
}

fn process_installation(repository: &Repository) -> Result<(), InstallError> {
    let repository_json = serde_json::to_string(repository).map_err(|e| {
        eprintln!("[process_installation] Failed to serialize repository: {e}");
        InstallError::InvalidInput
    })?;

    let status = Command::new("pkexec")
        .arg(helper_path())
        .arg("install")
        .arg(repository_json)
        .status()
        .map_err(|e| {
            eprintln!("[process_installation] Failed to execute pkexec: {e}");
            InstallError::PrivilegeEscalationFailed
        })?;

    if status.code() == Some(126) {
        eprintln!("[process_installation] Installation cancelled by user");
        return Err(InstallError::Cancelled);
    }

    if !status.success() {
        eprintln!(
            "[process_installation] Installation helper failed. Exit code: {:?}",
            status.code()
        );
        return Err(InstallError::PackageInstallFailed);
    }

    Ok(())
}

fn helper_path() -> std::path::PathBuf {
    std::env::current_dir()
        .expect("Failed to get current directory")
        .join("target/debug/helper")
}
