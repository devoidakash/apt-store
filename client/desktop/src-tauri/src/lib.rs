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
    // Step 1: Ask Ubuntu for the installed version.
    let output = Command::new("dpkg-query")
        .args(["-W", "-f=${Version}", &package_name])
        .output();

    // Step 2: If the command fails, treat the package as not installed.
    let output = match output {
        Ok(output) if output.status.success() => output,
        _ => return "not_installed".to_string(),
    };

    // Step 3: Convert the command's output into a Rust string.
    let installed_version = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if installed_version.is_empty() {
        return "not_installed".to_string();
    }

    // Step 4: Ask dpkg whether the installed version is older.
    let comparison = Command::new("dpkg")
        .args(["--compare-versions", &installed_version, "lt", &version])
        .status();

    // Step 5: Interpret the comparison result.
    match comparison {
        Ok(status) if status.success() => "update_available".to_string(),
        Ok(_) => "up_to_date".to_string(),
        Err(_) => "comparison failed".to_string(),
    }
}
