import constants from '$lib/constants';
import { parseNumLikeStr } from '$lib/utils/calculators';
import { get as lodashGet } from 'lodash-es';

export function judgeValidNumLikeStr(
	str: string,
	options?: Partial<{ precise: number; maximum: number; minimum: number }>
) {
	if (!(typeof str === 'string' && str && constants.regexps.valueFormat.test(str))) {
		return false;
	}

	const parsedValue = parseNumLikeStr(str);

	return judgeValidNum(parsedValue, options);
}

export function judgeValidNum(
	number: number | any,
	options?: Partial<{ precise: number; maximum: number; minimum: number }>
) {
	if (!(typeof number === 'number' && !Number.isNaN(number))) {
		return false;
	}

	const precise = lodashGet(options, 'precise');
	if (typeof precise === 'number' && precise > 0) {
		const [, fractions] = (number + '').split('.');
		if (fractions) {
			return fractions.length === precise;
		}
	}

	let maximum = lodashGet(options, 'maximum');
	if (!(typeof maximum === 'number' && !Number.isNaN(maximum))) {
		maximum = Number.MAX_SAFE_INTEGER;
	}

	let minimum = lodashGet(options, 'minimum');
	if (!(typeof minimum === 'number' && !Number.isNaN(minimum))) {
		minimum = Number.MIN_SAFE_INTEGER;
	}

	return number <= maximum && number >= minimum;
}
