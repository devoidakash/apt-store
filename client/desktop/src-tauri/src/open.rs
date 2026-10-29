use serde::Serialize;
use std::{
    fs,
    os::unix::process::CommandExt,
    path::PathBuf,
    process::{Command, Stdio},
};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum OpenError {
    InvalidInput,
    NotInstalled,
    NoLauncherFound,
    LaunchFailed,
}

#[tauri::command]
pub async fn open_app(package_name: String) -> Result<(), OpenError> {
    let result = tauri::async_runtime::spawn_blocking(move || launch_app(&package_name)).await;

    match result {
        Ok(open_result) => open_result,
        Err(e) => {
            eprintln!("[open_app] Failed to run in background: {e}");
            Err(OpenError::LaunchFailed)
        }
    }
}

fn launch_app(package_name: &str) -> Result<(), OpenError> {
    if package_name.trim().is_empty() {
        return Err(OpenError::InvalidInput);
    }

    let desktop_file = find_desktop_file(package_name)?;

    let status = Command::new("gio")
        .arg("launch")
        .arg(&desktop_file)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .process_group(0)
        .status()
        .map_err(|e| {
            eprintln!("[open_app] could not run gio: {e}");
            OpenError::LaunchFailed
        })?;

    if !status.success() {
        eprintln!("[open_app] gio launch failed with {status} for {desktop_file:?}");
        return Err(OpenError::LaunchFailed);
    }

    Ok(())
}

fn find_desktop_file(package_name: &str) -> Result<PathBuf, OpenError> {
    let output = Command::new("dpkg-query")
        .args(["-L", "--", package_name])
        .output()
        .map_err(|e| {
            eprintln!("[open_app] dpkg-query failed to run: {e}");
            OpenError::LaunchFailed
        })?;

    if !output.status.success() {
        return Err(OpenError::NotInstalled);
    }

    let file_list = String::from_utf8_lossy(&output.stdout);

    desktop_files(&file_list)
        .into_iter()
        .find(|path| is_visible(path))
        .ok_or(OpenError::NoLauncherFound)
}

fn desktop_files(file_list: &str) -> Vec<PathBuf> {
    file_list
        .lines()
        .filter(|line| line.starts_with("/usr/share/applications/") && line.ends_with(".desktop"))
        .map(PathBuf::from)
        .collect()
}

fn is_visible(path: &PathBuf) -> bool {
    match fs::read_to_string(path) {
        Ok(content) => !content.lines().any(|line| line.trim() == "NoDisplay=true"),
        Err(_) => false,
    }
}
