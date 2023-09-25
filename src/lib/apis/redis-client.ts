import type { IpcClientMetrics, IpcConnection, IpcResponse } from '$lib/types';
import { fetchIpc } from '$lib/utils/async';

export function fetchListRedisClientMetrics(guid: IpcConnection['guid']): Promise<IpcResponse<IpcClientMetrics>> {
	return fetchIpc<string>('list_client_metrics', { guid }).then(function (res) {
		const resData = res.data;

		let trueData = {};
		if (typeof resData === 'string') {
			try {
				trueData = JSON.parse(resData);
			} catch (e) {}
		}

		return {
			...res,
			data: trueData
		};
	});
}
