import type { IpcConnection, IpcConnections, SaveIpcConnectionPayload } from '$lib/types';
import { fetchIpc } from '$lib/utils/async';

export function fetchSaveConnection(payload: SaveIpcConnectionPayload) {
	return fetchIpc('save_connection', { connectionInfo: JSON.stringify(payload) });
}

export function fetchGetConnections() {
	return fetchIpc<IpcConnections>('get_connections');
}

export function fetchReleaseConnection(guid: IpcConnection['guid']) {
	return fetchIpc<IpcConnections>('release_connection', { guid });
}

export function fetchEstablishConnection(guid: IpcConnection['guid']) {
	return fetchIpc<IpcConnections>('establish_connection', { guid });
}

export function fetchRemoveConnection(guid: IpcConnection['guid']) {
	return fetchIpc<IpcConnections>('remove_connection', { guid });
}
