import type { IpcConnection, IpcConnections } from '$lib/types';
import { fetchIpc } from '$lib/utils/async';

export function fetchListRedisClientMetrics(guid: IpcConnection['guid']) {
	return fetchIpc<IpcConnections>('list_client_metrics', { guid });
}
