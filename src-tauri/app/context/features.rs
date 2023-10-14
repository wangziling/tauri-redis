use crate::features::context::InternalSystemTrayMenuId;
use tauri::{
    Builder, CustomMenuItem, Manager, Runtime, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem, SystemTrayMenuItemHandle, Window,
};
use tauri_plugin_tauri_redis_translation::TRANSLATIONS;

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

    let handle_toggle_window_visible =
        move |window: Window<R>, item_handle: SystemTrayMenuItemHandle<R>| {
            let is_window_visible = window.is_visible().unwrap();

            if is_window_visible {
                // you can also `set_selected`, `set_enabled` and `set_native_image` (macOS only).
                window.hide().unwrap();
            } else {
                // you can also `set_selected`, `set_enabled` and `set_native_image` (macOS only).
                window.show().unwrap();
                window.set_focus().unwrap();
            }

            tauri::async_runtime::spawn(async move {
                let translator = TRANSLATIONS.read().await;
                item_handle
                    .set_title(
                        translator
                            .translate(
                                if is_window_visible {
                                    "show app|Show"
                                } else {
                                    "hide app|Hide"
                                },
                                None,
                            )
                            .unwrap(),
                    )
                    .unwrap();
            });
        };

    b.system_tray(SystemTray::new().with_menu(menu))
        .on_system_tray_event(move |app, event| {
            match event {
                SystemTrayEvent::LeftClick { .. } | SystemTrayEvent::DoubleClick { .. } => {
                    handle_toggle_window_visible(
                        app.get_window("main").unwrap(),
                        app.tray_handle()
                            .get_item(InternalSystemTrayMenuId::ToggleAppVisible.into()),
                    );
                }
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    // get a handle to the clicked menu item
                    // note that `tray_handle` can be called anywhere,
                    // just get an `AppHandle` instance with `app.handle()` on the setup hook
                    // and move it to another function or thread
                    let item_handle = app.tray_handle().get_item(&id);

                    match id.into() {
                        InternalSystemTrayMenuId::QuitApp => {
                            std::process::exit(0);
                        }
                        InternalSystemTrayMenuId::ToggleAppVisible => {
                            handle_toggle_window_visible(
                                app.get_window("main").unwrap(),
                                item_handle,
                            );
                        }
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
