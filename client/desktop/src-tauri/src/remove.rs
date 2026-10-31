use crate::types::RemoveError;
use std::process::Command;

#[tauri::command]
pub async fn remove_packages(package_name: String) -> Result<(), RemoveError> {
    tauri::async_runtime::spawn_blocking(move || process_remove(package_name))
        .await
        .unwrap_or_else(|e| {
            eprintln!("[remove_packages] Failed to execute removal in background: {e}");
            Err(RemoveError::BackgroundTaskFailed)
        })
}

fn process_remove(package_name: String) -> Result<(), RemoveError> {
    let status = Command::new("pkexec")
        .arg(helper_path())
        .arg("remove")
        .arg(package_name)
        .status()
        .map_err(|e| {
            eprintln!("[process_remove] Failed to execute pkexec: {e}");
            RemoveError::PrivilegeEscalationFailed
        })?;

    if status.code() == Some(126) {
        eprintln!("[process_remove] Removal cancelled by user");
        return Err(RemoveError::Cancelled);
    }

    if !status.success() {
        eprintln!(
            "[process_remove] Removal helper failed. Exit code: {:?}",
            status.code()
        );
        return Err(RemoveError::PackageRemovalFailed);
    }

    Ok(())
}

fn helper_path() -> std::path::PathBuf {
    std::env::current_dir()
        .expect("Failed to get current directory")
        .join("target/debug/helper")
}
