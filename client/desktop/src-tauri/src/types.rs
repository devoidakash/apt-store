use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Repository {
    pub package_name: String,
    pub uri: String,
    pub suite: String,
    pub component: Option<String>,
    pub key_content: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum InstallError {
    PackageInstallFailed,
    InvalidInput,
    FileSystemError,
    RepositorySetupFailed,
    KeySetupFailed,
    Cancelled,
    Unknown,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum RemoveError {
    Cancelled,
    InvalidInput,
    PackageRemovalFailed,
}
