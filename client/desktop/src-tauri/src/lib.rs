pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![check_package_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use std::process::Command;

#[tauri::command]
fn check_package_status(package_name: &str, version: &str) -> String {
    // Query the installed package status and version
    let output = match Command::new("dpkg-query")
        .args(["-W", "-f=${Status}\t${Version}", package_name])
        .output()
    {
        Ok(output) if output.status.success() => output,
        Ok(_) => return "not_installed".to_string(),
        Err(_) => return "check_failed".to_string(),
    };

    // Parse dpkg-query output
    let output_text = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let (status, installed_version) = match output_text.split_once('\t') {
        Some((status, installed_version)) => (status, installed_version),
        None => return "not_installed".to_string(),
    };
    if status != "install ok installed" {
        return "not_installed".to_string();
    }
    if installed_version.is_empty() {
        return "not_installed".to_string();
    }

    // Compare installed and requested versions
    match Command::new("dpkg")
        .args(["--compare-versions", installed_version, "lt", version])
        .status()
    {
        Ok(status) if status.success() => "update_available".to_string(),
        Ok(status) if status.code() == Some(1) => "up_to_date".to_string(),
        _ => "comparison_failed".to_string(),
    }
}
