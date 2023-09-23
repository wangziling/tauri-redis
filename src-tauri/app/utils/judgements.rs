use crate::features::command::Guid;
use crate::features::error::{Error, Result};

pub fn judge_guid_valid(guid: &Guid) -> Result<bool> {
    if uuid::Uuid::parse_str(guid)
        .map_err(|_| Error::InvalidGuid)?
        .get_variant()
        .eq(&uuid::Variant::Future)
    {
        return Err(Error::InvalidGuid);
    }

    Ok(true)
}
