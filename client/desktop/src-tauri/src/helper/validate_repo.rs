use crate::types::{Repository, InstallError};
use url::Url;

pub fn validate_repository(repository: &Repository) -> Result<(), InstallError> {
    if repository.package_name.trim().is_empty()
        || repository.suite.trim().is_empty()
        || repository.key_content.trim().is_empty()
    {
        return Err(InstallError::InvalidInput);
    }

    if !is_valid_package_name(&repository.package_name) {
        return Err(InstallError::InvalidInput);
    }

    if repository.suite.chars().any(char::is_whitespace) {
        return Err(InstallError::InvalidInput);
    }

    if let Some(component) = repository.component.as_deref() {
        if component.chars().any(char::is_whitespace) {
            return Err(InstallError::InvalidInput);
        }
    }

    if repository.uri.contains(['\n', '\r']) {
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

fn is_valid_package_name(package_name: &str) -> bool {
    !package_name.is_empty()
        && package_name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '.' | '+'))
}
