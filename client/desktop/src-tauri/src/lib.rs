mod app_status;
use app_status::check_package_status;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![check_package_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
