use crate::features::context::InternalSystemTrayMenuId;
use tauri::{
    Builder, CustomMenuItem, Manager, Runtime, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};

fn generate_system_tray<R>(b: Builder<R>) -> Builder<R>
where
    R: Runtime,
{
    let quit = CustomMenuItem::new(InternalSystemTrayMenuId::QuitApp, "Quit");
    let hide = CustomMenuItem::new(InternalSystemTrayMenuId::ToggleAppVisible, "Hide");

    let menu = SystemTrayMenu::new()
        .add_item(quit)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(hide);

    b.system_tray(SystemTray::new().with_menu(menu))
        .on_system_tray_event(move |app, event| {
            match event {
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    // get a handle to the clicked menu item
                    // note that `tray_handle` can be called anywhere,
                    // just get an `AppHandle` instance with `app.handle()` on the setup hook
                    // and move it to another function or thread
                    // let item_handle = app.tray_handle().get_item(&id);

                    match id.into() {
                        InternalSystemTrayMenuId::QuitApp => {
                            std::process::exit(0);
                        }
                        InternalSystemTrayMenuId::ToggleAppVisible => {
                            let window = app.get_window("main").unwrap();

                            if window.is_visible().unwrap() {
                                window.hide().unwrap();
                                // you can also `set_selected`, `set_enabled` and `set_native_image` (macOS only).
                                // item_handle.set_title("Show").unwrap();
                            } else {
                                window.show().unwrap();
                                // you can also `set_selected`, `set_enabled` and `set_native_image` (macOS only).
                                // item_handle.set_title("Hide").unwrap();
                            }
                        } // _ => {}
                    }
                }
                _ => {}
            }
        })
}

pub fn register_features<R>(b: Builder<R>) -> Builder<R>
where
    R: Runtime,
{
    let b = generate_system_tray(b);

    b
}
