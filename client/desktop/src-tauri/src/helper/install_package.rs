use super::create_repo;
use super::validate_repo::validate_repository;
use crate::repo_status::check_repo_status;
use crate::types::{InstallError, Repository};
use std::{path::Path, process::Command};

pub fn install(repository: &Repository) -> Result<(), InstallError> {
    validate_repository(repository)?;
    match check_repo_status(&repository.uri) {
        Some(filepath) => install_package(&filepath, &repository.package_name),
        None => {
            let filepath = create_repo::create_repo(repository)?;
            install_package(&filepath, &repository.package_name)
        }
    }
}

fn install_package(filepath: &Path, package_name: &str) -> Result<(), InstallError> {
    // Step 1: Update package lists for the specified repository.
    let output = Command::new("apt-get")
        .arg("update")
        .arg("-o")
        .arg(format!("Dir::Etc::sourcelist={}", filepath.display()))
        .arg("-o")
        .arg("Dir::Etc::sourceparts=-")
        .arg("-o")
        .arg("APT::Get::List-Cleanup=0")
        .output()
        .map_err(|_| InstallError::RepositorySetupFailed)?;

    if !output.status.success() {
        return Err(InstallError::RepositorySetupFailed);
    }

    // Step 2: Install the requested package.
    let output = Command::new("apt-get")
        .args(["install", "-y", package_name])
        .output()
        .map_err(|_| InstallError::PackageInstallFailed)?;

    if !output.status.success() {
        return Err(InstallError::PackageInstallFailed);
    }

    Ok(())
}
