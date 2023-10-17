import { fetchIpc } from '$lib/utils/async';

export function fetchRecordPageRouteVisited(pageRoute: string) {
	return fetchIpc<void>('record_page_route_visited', { pageRoute });
}

export function fetchJudgePageRouteVisited(pageRoute: string) {
	return fetchIpc<boolean>('judge_page_route_visited', { pageRoute });
}
