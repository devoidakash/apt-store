use desktop_lib::helper::install_package;
use desktop_lib::types::Repository;

use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();

    match args.get(1).map(String::as_str) {
        Some("install") => {
            if args.len() != 3 {
                eprintln!("Usage: helper install <repository_json>");
                std::process::exit(1);
            }

            let repository: Repository = match serde_json::from_str(&args[2]) {
                Ok(repository) => repository,
                Err(error) => {
                    eprintln!("Invalid repository payload: {error}");
                    std::process::exit(1);
                }
            };

            if let Err(error) = install_package::install(&repository) {
                eprintln!("Installation failed: {:?}", error);
                std::process::exit(1);
            }
        }

        _ => {
            eprintln!("Unknown operation");
            std::process::exit(1);
        }
    }
}
