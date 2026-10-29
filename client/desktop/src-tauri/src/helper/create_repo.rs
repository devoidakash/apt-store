use std::fs;
use std::path::PathBuf;

use crate::types::{InstallError, Repository};

pub fn create_repo(repository: &Repository) -> Result<PathBuf, InstallError> {
    let key_path = PathBuf::from(format!(
        "/etc/apt/keyrings/aptstore-{}.asc",
        repository.package_name
    ));

    let source_path = PathBuf::from(format!(
        "/etc/apt/sources.list.d/aptstore-{}.sources",
        repository.package_name
    ));

    let components = if let Some(component) = repository
        .component
        .as_deref()
        .filter(|c| !c.trim().is_empty())
    {
        format!("Components: {}\n", component)
    } else {
        String::new()
    };

    let source_content = format!(
        "Types: deb\nURIs: {}\nSuites: {}\n{}Signed-By: {}\n",
        repository.uri,
        repository.suite,
        components,
        key_path.display()
    );
    let key_content = repository.key_content.trim();

    fs::create_dir_all("/etc/apt/keyrings").map_err(|_| InstallError::FileSystemError)?;
    fs::create_dir_all("/etc/apt/sources.list.d").map_err(|_| InstallError::FileSystemError)?;

    fs::write(&key_path, key_content).map_err(|_| InstallError::KeySetupFailed)?;

    if fs::write(&source_path, source_content).is_err() {
        let _ = fs::remove_file(&key_path);
        return Err(InstallError::RepositorySetupFailed);
    }

    Ok(source_path)
}
