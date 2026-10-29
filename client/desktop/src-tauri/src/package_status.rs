use serde::Serialize;
use std::process::Command;

#[derive(Debug, Serialize)]
pub enum PackageStatus {
    Installed,
    NotInstalled,
    UpdateAvailable,
    OnHold,
    Error,
}

#[derive(Debug)]
enum InstalledState {
    Installed(String),
    NotInstalled,
    OnHold,
    QueryFailed,
    Unreadable,
}

#[tauri::command]
pub(crate) async fn check_package_status(
    package_name: String,
    latest_version: String,
) -> PackageStatus {
    let result = tauri::async_runtime::spawn_blocking(move || {
        get_package_status(&package_name, &latest_version)
    })
    .await;

    match result {
        Ok(status) => status,
        Err(e) => {
            eprintln!(
                "[check_package_status] Failed to execute package status check in background: {e}"
            );
            PackageStatus::Error
        }
    }
}

fn get_package_status(package_name: &str, latest_version: &str) -> PackageStatus {
    if package_name.is_empty() || latest_version.is_empty() {
        eprintln!("[check_package_status] empty package name or latest version received");
        return PackageStatus::Error;
    }

    match read_installed_state(package_name) {
        InstalledState::QueryFailed => PackageStatus::Error,
        InstalledState::Unreadable => PackageStatus::Error,
        InstalledState::OnHold => PackageStatus::OnHold,
        InstalledState::Installed(installed_version) => {
            compare_versions(&installed_version, latest_version)
        }
        InstalledState::NotInstalled => PackageStatus::NotInstalled,
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

fn compare_versions(installed: &str, latest: &str) -> PackageStatus {
    match Command::new("dpkg")
        .args(["--compare-versions", installed, "lt", latest])
        .status()
    {
        Ok(status) if status.success() => PackageStatus::UpdateAvailable,
        Ok(status) if status.code() == Some(1) => PackageStatus::Installed,
        Ok(status) => {
            eprintln!(
                "[check_package_status] dpkg --compare-versions gave code {:?} for {installed} vs {latest}",
                status.code()
            );
            PackageStatus::Error
        }
        Err(e) => {
            eprintln!("[check_package_status] dpkg could not run: {e}");
            PackageStatus::Error
        }
    }
}
