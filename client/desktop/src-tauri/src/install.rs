use crate::types::{InstallError, Repository};
use std::process::Command;

#[tauri::command]
pub async fn install_packages(repository: Repository) -> Result<(), InstallError> {
    let result =
        tauri::async_runtime::spawn_blocking(move || process_installation(&repository)).await;

    match result {
        Ok(install_result) => install_result,
        Err(e) => {
            eprintln!("[install_packages] Failed to execute installation in background: {e}");
            Err(InstallError::PackageInstallFailed)
        }
    }
}

fn process_installation(repository: &Repository) -> Result<(), InstallError> {
    let repository_json =
        serde_json::to_string(repository).map_err(|_| InstallError::InvalidInput)?;

    let status = Command::new("pkexec")
        .arg(helper_path())
        .arg("install")
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
