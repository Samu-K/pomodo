use serde::{Deserialize, Serialize};
use tauri::Manager;
use specta::specta;
#[cfg(target_os = "ios")]
use objc::{msg_send, sel, sel_impl};
#[cfg(target_os = "ios")]
use objc::runtime::Object;

#[derive(Serialize, Deserialize, Clone, specta::Type)]
pub struct LiveActivityConfig {
    pub expiry_date: f64, // Unix timestamp in seconds
    pub mode: String,
    pub completed_cycles: i32,
    pub total_cycles_for_long_rest: i32,
}

#[derive(Serialize, Deserialize, Clone, specta::Type)]
pub struct LiveActivityUpdate {
    pub expiry_date: Option<f64>,
    pub mode: Option<String>,
    pub completed_cycles: Option<i32>,
}

#[tauri::command]
#[specta::specta]
#[allow(unused_variables)]
pub fn start_live_activity(config: LiveActivityConfig) {
    #[cfg(target_os = "ios")]
    unsafe {
        let cls = objc::runtime::Class::get("LiveActivityManager");
        if let Some(cls) = cls {
            let shared: *mut Object = msg_send![cls, shared];
            if !shared.is_null() {
                let mode_str = std::ffi::CString::new(config.mode).unwrap();
                let mode_ns: *mut Object = msg_send![objc::class!(NSString), stringWithUTF8String: mode_str.as_ptr()];
                
                let _: () = msg_send![shared, startWithExpiryDate: config.expiry_date 
                                                  mode: mode_ns 
                                                  completedCycles: config.completed_cycles 
                                                  totalCyclesForLongRest: config.total_cycles_for_long_rest];
            }
        } else {
             println!("LiveActivityManager class not found");
        }
    }
}

#[tauri::command]
#[specta::specta]
#[allow(unused_variables)]
pub fn update_live_activity(update: LiveActivityUpdate) {
    #[cfg(target_os = "ios")]
    unsafe {
        let cls = objc::runtime::Class::get("LiveActivityManager");
        if let Some(cls) = cls {
            let shared: *mut Object = msg_send![cls, shared];
            if !shared.is_null() {
                let mode_str = std::ffi::CString::new(update.mode.unwrap_or("".to_string())).unwrap();
                let mode_ns: *mut Object = msg_send![objc::class!(NSString), stringWithUTF8String: mode_str.as_ptr()];
                
                let expiry = update.expiry_date.unwrap_or(0.0);
                let cycles = update.completed_cycles.unwrap_or(-1);
                
                let _: () = msg_send![shared, updateWithExpiryDate: expiry 
                                                  mode: mode_ns 
                                                  completedCycles: cycles];
            }
        }
    }
}

#[tauri::command]
#[specta::specta]
pub fn stop_live_activity() {
    #[cfg(target_os = "ios")]
    unsafe {
        let cls = objc::runtime::Class::get("LiveActivityManager");
        if let Some(cls) = cls {
             let shared: *mut Object = msg_send![cls, shared];
             if !shared.is_null() {
                 let _: () = msg_send![shared, end];
             }
        }
    }
}
