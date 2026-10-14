use std::net::TcpStream;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;

pub struct BackendState(pub Mutex<Option<Child>>);

fn is_backend_running() -> bool {
    TcpStream::connect_timeout(
        &"127.0.0.1:8009".parse().unwrap(),
        Duration::from_millis(300),
    )
    .is_ok()
}

fn find_project_root() -> PathBuf {
    if let Ok(cwd) = std::env::current_dir() {
        if cwd.join(".venv").exists() || cwd.join("backend").exists() {
            return cwd;
        }
        if let Some(parent) = cwd.parent() {
            if parent.join(".venv").exists() || parent.join("backend").exists() {
                return parent.to_path_buf();
            }
        }
    }
    if let Ok(exe_path) = std::env::current_exe() {
        let mut cur = exe_path.as_path();
        while let Some(parent) = cur.parent() {
            if parent.join(".venv").exists() || parent.join("backend").exists() {
                return parent.to_path_buf();
            }
            cur = parent;
        }
    }

    // Fallback ke path instalasi proyek default jika berkas exe dipindahkan ke Desktop atau lokasi luar
    let default_project_path = PathBuf::from(r"C:\Users\shint\Projects\Element-maker");
    if default_project_path.join(".venv").exists() || default_project_path.join("backend").exists() {
        return default_project_path;
    }

    PathBuf::from(".")
}

fn start_backend() -> Option<Child> {
    if is_backend_running() {
        log::info!("Backend server sudah aktif di port 8009.");
        return None;
    }

    let root = find_project_root();
    let venv_python = root.join(".venv").join("Scripts").join("python.exe");

    let python_cmd = if venv_python.exists() {
        venv_python
    } else {
        PathBuf::from("python")
    };

    log::info!("Menyalakan backend server dari: {:?}", root);

    let mut cmd = Command::new(&python_cmd);
    cmd.current_dir(&root);
    cmd.args([
        "-m",
        "uvicorn",
        "backend.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8009",
    ]);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    match cmd.spawn() {
        Ok(child) => {
            log::info!("Proses backend berhasil dinyalakan (PID: {}).", child.id());
            Some(child)
        }
        Err(e) => {
            log::error!("Gagal menyalakan backend server: {:?}", e);
            None
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(BackendState(Mutex::new(None)))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let child = start_backend();
            if let Some(state) = app.try_state::<BackendState>() {
                if let Ok(mut lock) = state.0.lock() {
                    *lock = child;
                }
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<BackendState>() {
                    if let Ok(mut lock) = state.0.lock() {
                        if let Some(mut child) = lock.take() {
                            log::info!("Mematikan proses backend server...");
                            let _ = child.kill();
                        }
                    }
                }
            }
        });
}
