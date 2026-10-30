use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
pub enum PackageStatus {
    Installed,
    NotInstalled,
    UpdateAvailable,
    OnHold,
    Error,
}

#[derive(Serialize)]
pub enum PackageError {
    CheckFailed,
}

enum InstalledState {
    Installed(String),
    NotInstalled,
    OnHold,
    QueryFailed,
    Unreadable,
}

#[tauri::command]
pub async fn check_package_status(
    package_name: String,
    latest_version: String,
) -> Result<PackageStatus, PackageError> {
    tauri::async_runtime::spawn_blocking(move || get_package_status(&package_name, &latest_version))
        .await
        .unwrap_or_else(|e| {
            eprintln!(
                "[check_package_status] Failed to execute package status check in background: {e}"
            );
            Err(PackageError::CheckFailed)
        })
}

fn get_package_status(
    package_name: &str,
    latest_version: &str,
) -> Result<PackageStatus, PackageError> {
    if package_name.is_empty() || latest_version.is_empty() {
        eprintln!("[check_package_status] empty package_name or latest_version received");
        return Err(PackageError::CheckFailed);
    }

    match read_installed_state(package_name) {
        InstalledState::QueryFailed | InstalledState::Unreadable => Ok(PackageStatus::Error),
        InstalledState::OnHold => Ok(PackageStatus::OnHold),
        InstalledState::Installed(installed_version) => {
            compare_versions(&installed_version, latest_version)
        }
        InstalledState::NotInstalled => Ok(PackageStatus::NotInstalled),
    }
}

fn read_installed_state(package_name: &str) -> InstalledState {
    let output = match Command::new("dpkg-query")
        .args([
            "-W",
            "--showformat=${Status}\t${Version}",
            "--",
            package_name,
        ])
        .output()
    {
        Ok(output) => output,
        Err(e) => {
            eprintln!("[check_package_status] dpkg-query failed to run: {e}");
            return InstalledState::QueryFailed;
        }
    };

    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout);
        return parse_dpkg_output(&text);
    }

    if output.status.code() == Some(1) {
        return InstalledState::NotInstalled;
    }

    eprintln!(
        "[check_package_status] dpkg-query failed, code {:?}, stderr: {}",
        output.status.code(),
        String::from_utf8_lossy(&output.stderr).trim()
    );
    InstalledState::Unreadable
}

fn parse_dpkg_output(text: &str) -> InstalledState {
    let text = text.trim_end();

    let Some((status, version)) = text.split_once('\t') else {
        eprintln!("[check_package_status] unexpected dpkg-query output: {text:?}");
        return InstalledState::Unreadable;
    };

    if status.trim() == "hold ok installed" {
        eprintln!("[check_package_status] package is on hold: {status}");
        return InstalledState::OnHold;
    }

    if status.trim() == "install ok installed" {
        return InstalledState::Installed(version.to_string());
    }

    if status.trim().ends_with("config-files") || status.trim().ends_with("not-installed") {
        return InstalledState::NotInstalled;
    }

    eprintln!("[check_package_status] unexpected package status: {status}");
    InstalledState::Unreadable
}

fn compare_versions(installed: &str, latest: &str) -> Result<PackageStatus, PackageError> {
    match Command::new("dpkg")
        .args(["--compare-versions", installed, "lt", latest])
        .status()
    {
        Ok(status) if status.success() => Ok(PackageStatus::UpdateAvailable),
        Ok(status) if status.code() == Some(1) => Ok(PackageStatus::Installed),
        Ok(status) => {
            eprintln!(
                "[check_package_status] dpkg --compare-versions gave code {:?} for {installed} vs {latest}",
                status.code()
            );
            Err(PackageError::CheckFailed)
        }
        Err(e) => {
            eprintln!("[check_package_status] dpkg could not run: {e}");
            Err(PackageError::CheckFailed)
        }
    }
}
