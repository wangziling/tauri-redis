import { times, reduce, uniq } from 'lodash-es';
import type { CalcDynamicClassesParams } from '$lib/types';
import { IpcKeyType } from '$lib/types';

export function randomString(len: number) {
	return times(len, function iteration() {
		return ((Math.random() * 0xf) | 0).toString(16);
	}).join('');
}

export function calcRandomCompNameSuffix() {
	return randomString(8);
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

export function parseNumLikeStr(str: string): number {
	return parseFloat(str);
}

export function calcIpcKeyType(source: string) {
	if (typeof source !== 'string') {
		return;
	}

	return Object.values(IpcKeyType).find((type) => type.toLowerCase() === source.toLowerCase());
}

export function emptyInsteadBy(value: any, instead: any = '-') {
	return value ? value : instead;
}

export function createEachTagKeyGenerator(prefix: string = randomString(5)) {
	let num = 0;

	return function (key: string | number) {
		return `${prefix}: ${key} - ${num++}`;
	};
}
