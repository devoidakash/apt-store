use crate::types::{RemoveError, Repository};
use std::process::Command;

pub fn remove(repository: &Repository) -> Result<(), RemoveError> {
    if repository.package_name.trim().is_empty() {
        return Err(RemoveError::InvalidInput);
    }

    let output = Command::new("apt-get")
        .arg("remove")
        .arg("-y")
        .arg("--")
        .arg(&repository.package_name)
        .output()
        .map_err(|_| RemoveError::PackageRemovalFailed)?;

    if !output.status.success() {
        return Err(RemoveError::PackageRemovalFailed);
    }

    Ok(())
}
