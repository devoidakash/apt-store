use crate::types::RemoveError;
use std::process::Command;

pub fn remove(package_name: &str) -> Result<(), RemoveError> {
    if package_name.trim().is_empty() {
        return Err(RemoveError::InvalidInput);
    }

    let output = Command::new("apt-get")
        .arg("remove")
        .arg("-y")
        .arg("--")
        .arg(package_name)
        .output()
        .map_err(|e| {
            eprintln!("[remove] Failed to execute apt-get remove: {e}");
            RemoveError::PackageRemovalFailed
        })?;

    if !output.status.success() {
        eprintln!(
            "[remove] Package removal failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        return Err(RemoveError::PackageRemovalFailed);
    }

    Ok(())
}
