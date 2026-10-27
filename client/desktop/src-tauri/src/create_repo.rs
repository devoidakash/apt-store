use crate::install::{InstallError, Repository};
use url::Url;

pub struct RepoFiles {
    pub key_content: String,
    pub source_content: String,
}

pub fn create_repo(repository: &Repository) -> Result<RepoFiles, InstallError> {
    validate_repository(repository)?;

    let components = if let Some(component) = repository
        .component
        .as_deref()
        .filter(|c| !c.trim().is_empty())
    {
        format!("Components: {}\n", component)
    } else {
        String::new()
    };

    let key_path = format!("/etc/apt/keyrings/aptstore-{}.asc", repository.package_name);

    let source_content = format!(
        "Types: deb\nURIs: {}\nSuites: {}\n{}Signed-By: {}\n",
        repository.uri, repository.suite, components, key_path
    );

    let key_content = repository.key_content.trim().to_string();

    Ok(RepoFiles {
        key_content,
        source_content,
    })
}

fn validate_repository(repository: &Repository) -> Result<(), InstallError> {
    if repository.package_name.trim().is_empty()
        || repository.suite.trim().is_empty()
        || repository.key_content.trim().is_empty()
    {
        return Err(InstallError::InvalidInput);
    }

    let uri = Url::parse(&repository.uri).map_err(|_| InstallError::InvalidInput)?;

    if uri.scheme() != "https" || uri.host_str().is_none() {
        return Err(InstallError::InvalidInput);
    }

    if !repository
        .key_content
        .contains("-----BEGIN PGP PUBLIC KEY BLOCK-----")
        || !repository
            .key_content
            .contains("-----END PGP PUBLIC KEY BLOCK-----")
    {
        return Err(InstallError::InvalidInput);
    }

    Ok(())
}
