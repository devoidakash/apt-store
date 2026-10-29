pub mod helper;
mod install;
mod open;
mod package_status;
mod repo_status;
pub mod types;
mod update;

use install::install_packages;
use open::open_app;
use package_status::check_package_status;
use update::update_packages;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_package_status,
            install_packages,
            update_packages,
            open_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
