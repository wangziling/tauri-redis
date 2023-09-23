pub fn gen_uuid() -> String {
    uuid::Uuid::new_v4().hyphenated().to_string()
}

pub fn get_cur_time() -> String {
    chrono::Local::now().to_rfc3339()
}
