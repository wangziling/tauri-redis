use crate::features::error::Result;
use crate::features::events::Events;
use tauri::{AppHandle, Manager, Runtime, Window};

#[tauri::command]
pub async fn close_splashscreen<R>(window: Window<R>, handle: AppHandle<R>) -> Result<()>
where
    R: Runtime,
{
    // Close splash screen
    window
        .get_window("splashscreen")
        .expect("no window labeled 'splashscreen' found")
        .close()
        .unwrap();

    // Show main window.
    window
        .get_window("main")
        .expect("no window labeled 'main' found")
        .show()
        .unwrap();

    Events::trigger_with_type(&handle, Events::WindowVisibleChangedManually, None)?;

    Ok(())
}
