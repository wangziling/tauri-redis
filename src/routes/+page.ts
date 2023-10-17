// Add this, or 'window' will be an undeclared variable.
import { fetchJudgePageRouteVisited, fetchRecordPageRouteVisited } from '$lib/apis';
import type { PageLoad } from './$types';
import { goto } from '$app/navigation';

// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;

// Add this, or 'window' will be an undeclared variable.
export const ssr = false;

export const load: PageLoad = function load(params) {
	const routeId = params.route.id;
	// Record this page visited.
	fetchRecordPageRouteVisited(routeId);

	if (routeId !== '/') {
		return;
	}

	// If we already visited '/connections'.
	// Automatically redirect to '/connections' route.
	const connectionsRouteId = '/connections';
	return fetchJudgePageRouteVisited(connectionsRouteId)
		.then((res) => {
			if (res.data) {
				throw goto(connectionsRouteId);
			}
		})
		.catch((e) => {});
};
