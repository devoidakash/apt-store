use crate::types::{InstallError, Repository};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

pub fn create_repo(repository: &Repository) -> Result<PathBuf, InstallError> {
    let key_path = PathBuf::from(format!(
        "/etc/apt/keyrings/aptstore-{}.asc",
        repository.package_name
    ));

    let source_path = PathBuf::from(format!(
        "/etc/apt/sources.list.d/aptstore-{}.sources",
        repository.package_name
    ));

    let components = match repository
        .component
        .as_deref()
        .filter(|component| !component.trim().is_empty())
    {
        Some(component) => format!("Components: {}\n", component),
        None => String::new(),
    };

    let source_content = format!(
        "Types: deb\nURIs: {}\nSuites: {}\n{}Signed-By: {}\n",
        repository.uri,
        repository.suite,
        components,
        key_path.display()
    );

    let key_content = format!("{}\n", repository.key_content.trim());

    fs::create_dir_all("/etc/apt/keyrings").map_err(|_| InstallError::FileSystemError)?;

    fs::create_dir_all("/etc/apt/sources.list.d").map_err(|_| InstallError::FileSystemError)?;

    // create_new prevents accidentally overwriting an existing key.
    let mut key_file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&key_path)
        .map_err(|error| {
            eprintln!("[create_repo] Failed to create key file: {error}");
            InstallError::KeySetupFailed
        })?;

    if let Err(error) = key_file.write_all(key_content.as_bytes()) {
        eprintln!("[create_repo] Failed to write key file: {error}");
        let _ = fs::remove_file(&key_path);
        return Err(InstallError::KeySetupFailed);
    }

    // If source creation fails, remove the key created above.
    let mut source_file = match OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&source_path)
    {
        Ok(file) => file,
        Err(error) => {
            eprintln!("[create_repo] Failed to create source file: {error}");
            let _ = fs::remove_file(&key_path);
            return Err(InstallError::RepositorySetupFailed);
        }
    };

    if let Err(error) = source_file.write_all(source_content.as_bytes()) {
        eprintln!("[create_repo] Failed to write source file: {error}");
        let _ = fs::remove_file(&source_path);
        let _ = fs::remove_file(&key_path);
        return Err(InstallError::RepositorySetupFailed);
    }

    Ok(source_path)
}
