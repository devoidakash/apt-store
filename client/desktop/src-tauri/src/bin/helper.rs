use desktop_lib::helper::install_package;
use desktop_lib::helper::remove_package;
use desktop_lib::helper::update_package;
use desktop_lib::types::Repository;

use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();

    match args.get(1).map(String::as_str) {
        Some("install") | Some("update") => {
            if args.len() != 3 {
                eprintln!("Usage: helper <install|update> <repository_json>");
                std::process::exit(1);
            }

            let repository: Repository = match serde_json::from_str(&args[2]) {
                Ok(repository) => repository,
                Err(error) => {
                    eprintln!("Invalid repository payload: {error}");
                    std::process::exit(1);
                }
            };

            match args[1].as_str() {
                "install" => {
                    if let Err(error) = install_package::install(&repository) {
                        eprintln!("Installation failed: {:?}", error);
                        std::process::exit(1);
                    }
                }

                "update" => {
                    if let Err(error) = update_package::update(&repository) {
                        eprintln!("Update failed: {:?}", error);
                        std::process::exit(1);
                    }
                }

                _ => unreachable!(),
            }
        }

        Some("remove") => {
            if args.len() != 3 {
                eprintln!("Usage: helper remove <package_name>");
                std::process::exit(1);
            }

            let package_name = &args[2];

            if let Err(error) = remove_package::remove(package_name) {
                eprintln!("Removal failed: {:?}", error);
                std::process::exit(1);
            }
        }

        _ => {
            eprintln!("Unknown operation");
            std::process::exit(1);
        }
    }
}
