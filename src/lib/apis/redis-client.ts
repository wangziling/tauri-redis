import type { IpcClientMetrics, IpcConnection, IpcResponse } from '$lib/types';
import { fetchIpc } from '$lib/utils/async';

export function fetchListRedisClientMetrics(guid: IpcConnection['guid']) {
	return fetchIpc<IpcClientMetrics>('list_client_metrics', { guid });
}
