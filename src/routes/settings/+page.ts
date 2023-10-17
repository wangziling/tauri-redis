// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
import type { PageLoad } from './$types';
import { fetchRecordPageRouteVisited } from '$lib/apis';

export const prerender = true;

// Add this, or 'window' will be an undeclared variable.
export const ssr = false;

export const load: PageLoad = function load(params) {
	const routeId = params.route.id;

	// Record this page visited.
	fetchRecordPageRouteVisited(routeId);
};
