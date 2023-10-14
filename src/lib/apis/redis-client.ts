import type {
	IpcClientMetrics,
	IpcConnection,
	IpcRenameKeyPayload,
	SaveIpcNewKeyPayload,
	SetIpcKeyContentTypeStringPayload,
	SetIpcKeyTTLPayload
} from '$lib/types';
import { fetchIpc } from '$lib/utils/async';

export function fetchListRedisClientMetrics(guid: IpcConnection['guid']) {
	return fetchIpc<IpcClientMetrics>('list_client_metrics', { guid });
}

export function fetchListRedisAllKeys(guid: IpcConnection['guid'], conditionPart?: string) {
	return fetchIpc<string[]>('list_all_keys', { guid, conditionPart });
}

export function fetchScanRedisAllKeys(guid: IpcConnection['guid'], conditionPart?: string) {
	return fetchIpc<string[]>('scan_all_keys', { guid, conditionPart });
}

export function fetchRefreshScanRedisAllKeys(guid: IpcConnection['guid'], conditionPart?: string, offset?: number) {
	return fetchIpc<string[]>('refresh_scanned_all_keys', { guid, conditionPart, offset });
}

export function fetchCreateNewKey(guid: IpcConnection['guid'], params: SaveIpcNewKeyPayload) {
	return fetchIpc<void>('create_new_key', { guid, keyName: params.name, keyType: params.type });
}

export function fetchRemoveKey(guid: IpcConnection['guid'], keyName: string) {
	return fetchIpc<void>('remove_key', { guid, keyName });
}

export function fetchGetKeyType(guid: IpcConnection['guid'], keyName: string) {
	return fetchIpc<string>('get_key_type', { guid, keyName });
}

export function fetchGetKeyTTL(guid: IpcConnection['guid'], keyName: string) {
	return fetchIpc<number>('get_key_ttl', { guid, keyName });
}

export function fetchGetKeyContentTypeString(guid: IpcConnection['guid'], keyName: string) {
	return fetchIpc<string>('get_key_content_type_string', { guid, keyName });
}

export function fetchSetKeyTTL(guid: IpcConnection['guid'], params: SetIpcKeyTTLPayload) {
	return fetchIpc<void>('set_key_ttl', { guid, keyName: params.name, ttl: params.ttl });
}

export function fetchSetKeyContentTypeString(guid: IpcConnection['guid'], params: SetIpcKeyContentTypeStringPayload) {
	return fetchIpc<void>('set_key_content_type_string', { guid, keyName: params.name, content: params.content });
}

export function fetchRenameKey(guid: IpcConnection['guid'], params: IpcRenameKeyPayload) {
	return fetchIpc<void>('rename_key', { guid, keyName: params.name, newKeyName: params.newName });
}
