use crate::types::{InstallError, Repository};
use url::Url;

pub fn validate_repository(repository: &Repository) -> Result<(), InstallError> {
    // Check required fields.
    if repository.package_name.trim().is_empty()
        || repository.suite.trim().is_empty()
        || repository.uri.trim().is_empty()
        || repository.key_content.trim().is_empty()
    {
        return Err(InstallError::InvalidInput);
    }

    // Validate package name.
    if !is_valid_package_name(&repository.package_name) {
        return Err(InstallError::InvalidInput);
    }

    // Suite must not contain whitespace.
    if repository.suite.chars().any(char::is_whitespace) {
        return Err(InstallError::InvalidInput);
    }

    // This implementation supports one component.
    if let Some(component) = repository.component.as_deref() {
        if component.chars().any(char::is_whitespace) {
            return Err(InstallError::InvalidInput);
        }
    }

    // Prevent newlines from being injected into the APT source file.
    if repository.uri.contains(['\n', '\r'])
        || repository.suite.contains(['\n', '\r'])
        || repository.package_name.contains(['\n', '\r'])
    {
        return Err(InstallError::InvalidInput);
    }

    // Validate repository URL.
    let uri = Url::parse(&repository.uri).map_err(|_| InstallError::InvalidInput)?;

    if uri.scheme() != "https" || uri.host_str().is_none() {
        return Err(InstallError::InvalidInput);
    }

    // Check for the expected ASCII-armored public key markers.
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
    let mut chars = package_name.chars();

    matches!(
        chars.next(),
        Some(character)
            if character.is_ascii_lowercase() || character.is_ascii_digit()
    ) && chars.all(|character| {
        character.is_ascii_lowercase()
            || character.is_ascii_digit()
            || matches!(character, '-' | '.' | '+')
    })
}
