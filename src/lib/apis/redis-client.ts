import type { IpcClientMetrics, IpcConnection, IpcResponse } from '$lib/types';
import { fetchIpc } from '$lib/utils/async';

export function fetchListRedisClientMetrics(guid: IpcConnection['guid']) {
	return fetchIpc<IpcClientMetrics>('list_client_metrics', { guid });
}

export function fetchListRedisAllKeys(guid: IpcConnection['guid'], conditionPart?: string) {
	return fetchIpc<IpcClientMetrics>('list_all_keys', { guid, conditionPart });
}
