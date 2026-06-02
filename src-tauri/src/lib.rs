pub mod error;
pub mod db;
pub mod services;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use sqlx::{SqlitePool, sqlite::SqliteConnectOptions};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            let app_dir = app_handle.path().app_config_dir()?;
            std::fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join("accounting.db");

            let pool = tauri::async_runtime::block_on(async {
                let options = SqliteConnectOptions::new()
                    .filename(&db_path)
                    .create_if_missing(true)
                    .foreign_keys(true)
                    .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
                    .busy_timeout(std::time::Duration::from_secs(5));
                let pool = SqlitePool::connect_with(options).await?;
                
                sqlx::migrate!().run(&pool).await?;

                Ok::<_, Box<dyn std::error::Error>>(pool)
            })?;

            app_handle.manage(pool);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

