import type { IpcConnection, IpcConnections } from '$lib/types/ipc';
import { fetchIpc } from '$lib/utils/async';

export function fetchSaveConnection(payload: IpcConnection) {
	return fetchIpc('save_connection', { connectionInfo: JSON.stringify(payload) });
}

export function fetchGetConnections() {
	return fetchIpc<IpcConnections>('get_connections');
}
