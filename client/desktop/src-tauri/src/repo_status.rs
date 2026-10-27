use std::{
    fs,
    path::{Path, PathBuf},
};

pub fn check_repo_status(uri: &str) -> Option<PathBuf> {
    if let Ok(entries) = fs::read_dir("/etc/apt/sources.list.d") {
        for entry in entries.flatten() {
            let path = entry.path();

            let is_apt_file = matches!(
                path.extension().and_then(|e| e.to_str()),
                Some("list" | "sources")
            );
            if !path.is_file() || !is_apt_file {
                continue;
            }

            if file_has_uri(&path, uri) {
                return Some(path);
            }
        }
    }

    let main = PathBuf::from("/etc/apt/sources.list");
    if file_has_uri(&main, uri) {
        return Some(main);
    }

    None
}

fn file_has_uri(path: &Path, uri: &str) -> bool {
    match fs::read_to_string(path) {
        Ok(content) => content
            .lines()
            .any(|line| !line.trim_start().starts_with('#') && line.contains(uri)),
        Err(_) => false,
    }
}
