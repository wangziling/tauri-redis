import { isNaN } from 'lodash-es';

export function judgeValidNumLikeStr(str: string) {
	return !isNaN(str);
}
