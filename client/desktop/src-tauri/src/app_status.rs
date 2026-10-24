use serde::Serialize;
use std::process::Command;

#[derive(Debug, PartialEq, Serialize)]
pub enum PackageStatus {
    NotInstalled,
    UpToDate,
    UpdateAvailable,
    OnHold,
    InstallCheckFailed,
    VersionCompareFailed,
}

#[derive(Debug, PartialEq)]
enum InstalledState {
    NotInstalled,
    Installed(String),
    OnHold(String),
    Unreadable,
}

#[tauri::command]
pub async fn check_package_status(package_name: String, latest_version: String) -> PackageStatus {
    let result = tauri::async_runtime::spawn_blocking(move || {
        get_package_status(&package_name, &latest_version)
    })
    .await;

    match result {
        Ok(status) => status,
        Err(e) => {
            eprintln!("[check_package_status] background task failed: {e}");
            PackageStatus::InstallCheckFailed
        }
    }
}

fn get_package_status(package_name: &str, latest_version: &str) -> PackageStatus {
    if package_name.is_empty() || latest_version.is_empty() {
        eprintln!("[check_package_status] empty package name or latest version received");
        return PackageStatus::InstallCheckFailed;
    }

    match read_installed_state(package_name) {
        InstalledState::NotInstalled => PackageStatus::NotInstalled,
        InstalledState::Unreadable => PackageStatus::InstallCheckFailed,
        InstalledState::Installed(installed_version) => {
            compare_versions(&installed_version, latest_version)
        }
        InstalledState::OnHold(_) => PackageStatus::OnHold,
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
            eprintln!("[check_package_status] dpkg-query could not run: {e}");
            return InstalledState::Unreadable;
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

// Expected text looks like: "install ok installed\t1.2.3-1"
fn parse_dpkg_output(text: &str) -> InstalledState {
    let text = text.trim_end_matches(['\n', '\r']);

    let Some((status, version)) = text.split_once('\t') else {
        eprintln!("[check_package_status] unexpected dpkg-query output: {text:?}");
        return InstalledState::Unreadable;
    };

    let words: Vec<&str> = status.split_whitespace().collect();
    if words.last() != Some(&"installed") {
        return InstalledState::NotInstalled;
    }
    let is_on_hold = words.first() == Some(&"hold");
    if is_on_hold {
        eprintln!("[check_package_status] package is on hold: {status}");
    }

    let version = version.trim();
    if version.is_empty() {
        eprintln!("[check_package_status] installed but version is empty: {status}");
        return InstalledState::Unreadable;
    }

    if is_on_hold {
        InstalledState::OnHold(version.to_string())
    } else {
        InstalledState::Installed(version.to_string())
    }
}

// Asks dpkg: "is installed < latest?"  exit 0 = yes, exit 1 = no.
fn compare_versions(installed: &str, latest: &str) -> PackageStatus {
    match Command::new("dpkg")
        .args(["--compare-versions", installed, "lt", latest])
        .status()
    {
        Ok(status) if status.success() => PackageStatus::UpdateAvailable,
        Ok(status) if status.code() == Some(1) => PackageStatus::UpToDate,
        Ok(status) => {
            eprintln!(
                "[check_package_status] dpkg --compare-versions gave code {:?} for {installed} vs {latest}",
                status.code()
            );
            PackageStatus::VersionCompareFailed
        }
        Err(e) => {
            eprintln!("[check_package_status] dpkg could not run: {e}");
            PackageStatus::VersionCompareFailed
        }
    }
}
