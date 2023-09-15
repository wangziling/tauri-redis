import { times, reduce, uniq } from 'lodash';
import type { CalcDynamicClassesParams } from '$lib/types';

export function randomString(len: number) {
	return times(len, function iteration() {
		return ((Math.random() * 0xf) | 0).toString(16);
	}).join('');
}

export function calcDynamicClasses(params: CalcDynamicClassesParams) {
	if (typeof params === 'string' && params) {
		return params;
	}

	if (!(typeof params === 'object' && params)) {
		return '';
	}

	if (Array.isArray(params)) {
		return uniq(params.map(calcDynamicClasses)).filter(Boolean).join(' ');
	}

	const result = reduce(
		params,
		function (acc, cur, key) {
			if (!cur) {
				return acc;
			}

			key && acc.push(key);

			return acc;
		},
		[] as string[]
	);

	return uniq(result).filter(Boolean).join(' ');
}
