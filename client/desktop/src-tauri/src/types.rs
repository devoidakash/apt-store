use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct Repository {
    pub package_name: String,
    pub uri: String,
    pub suite: String,
    pub component: Option<String>,
    pub key_content: String,
}

#[derive(Debug, serde::Serialize)]
pub enum InstallError {
    InvalidInput,
    FileSystemError,
    KeySetupFailed,
    RepositorySetupFailed,
    PackageInstallFailed,
    PrivilegeEscalationFailed,
    Cancelled,
    BackgroundTaskFailed,
}

#[derive(Debug, serde::Serialize)]
pub enum UpdateError {
    InvalidInput,
    RepositorySetupFailed,
    UpdateFailed,
    PrivilegeEscalationFailed,
    Cancelled,
    BackgroundTaskFailed,
}

#[derive(Debug, serde::Serialize)]
pub enum RemoveError {
    PrivilegeEscalationFailed,
    Cancelled,
    PackageRemovalFailed,
    BackgroundTaskFailed,
    InvalidInput,
}
