pub mod helper;
mod install;
mod package_status;
mod repo_status;
pub mod types;

use install::install_packages;
use package_status::check_package_status;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_package_status,
            install_packages
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
