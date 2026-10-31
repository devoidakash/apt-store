use super::create_repo;
use super::validate_repo::validate_repository;
use crate::repo_status::check_repo_status;
use crate::types::{Repository, UpdateError};
use std::{path::Path, process::Command};

pub fn update(repository: &Repository) -> Result<(), UpdateError> {
    validate_repository(repository).map_err(|error| {
        eprintln!("[update] Repository validation failed: {error:?}");
        UpdateError::InvalidInput
    })?;

    match check_repo_status(&repository.uri) {
        Some(filepath) => update_package(&filepath, &repository.package_name),
        None => {
            let filepath = create_repo::create_repo(repository).map_err(|error| {
                eprintln!("[update] Repository creation failed: {error:?}");
                UpdateError::RepositorySetupFailed
            })?;

            update_package(&filepath, &repository.package_name)
        }
    }
}

fn update_package(filepath: &Path, package_name: &str) -> Result<(), UpdateError> {
    // Step 1: Update package lists using only the specified repository.
    let output = Command::new("apt-get")
        .arg("update")
        .arg("-o")
        .arg(format!("Dir::Etc::sourcelist={}", filepath.display()))
        .arg("-o")
        .arg("Dir::Etc::sourceparts=-")
        .arg("-o")
        .arg("APT::Get::List-Cleanup=0")
        .output()
        .map_err(|error| {
            eprintln!("[update] Failed to execute apt-get update: {error}");
            UpdateError::RepositorySetupFailed
        })?;

    if !output.status.success() {
        eprintln!(
            "[update] Repository package-list update failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        return Err(UpdateError::RepositorySetupFailed);
    }

    // Step 2: Upgrade the requested package, if an upgrade is available.
    let output = Command::new("apt-get")
        .arg("-o")
        .arg(format!("Dir::Etc::sourcelist={}", filepath.display()))
        .arg("-o")
        .arg("Dir::Etc::sourceparts=-")
        .args(["install", "--only-upgrade", "-y", "--", package_name])
        .output()
        .map_err(|error| {
            eprintln!("[update] Failed to execute apt-get upgrade: {error}");
            UpdateError::UpdateFailed
        })?;

    if !output.status.success() {
        eprintln!(
            "[update] Package upgrade failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        return Err(UpdateError::UpdateFailed);
    }

    Ok(())
}
