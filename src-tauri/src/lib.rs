use tauri::WebviewWindow;
const WORKSPACE: &str = "https://catarseadm.vercel.app/";

#[tauri::command]
fn is_desktop() -> bool { cfg!(desktop) }

#[tauri::command]
async fn open_workspace(window: WebviewWindow) -> Result<(), String> {
    // Defense in depth: never expose native navigation to a remote page.
    let origin = window.url().map_err(|e| e.to_string())?;
    let local = origin.scheme() == "tauri" || origin.host_str() == Some("tauri.localhost")
        || (cfg!(debug_assertions) && origin.host_str() == Some("127.0.0.1"));
    if !local { return Err("Origem não autorizada".into()); }
    let response = reqwest::Client::builder().timeout(std::time::Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::none()).build().map_err(|e| e.to_string())?
        .get(format!("{}api/health", WORKSPACE)).send().await.map_err(|_| "Sem conexão".to_string())?;
    if !response.status().is_success() { return Err("Servidor indisponível".into()); }
    window.navigate(WORKSPACE.parse().unwrap()).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init());
    builder.invoke_handler(tauri::generate_handler![open_workspace, is_desktop])
        .run(tauri::generate_context!()).expect("Não foi possível iniciar a Catarse");
}
