import { messageManager } from '$lib/components/notification/message';
import { MessageType } from '$lib/types';
import { get as lodashGet } from 'lodash-es';

export function invokeErrorHandle(err: Error, options?: Partial<{ stopPropagation: boolean }>) {
	messageManager.append({
		content: err.message,
		type: MessageType.Error,
		closable: true
	});

	if (!lodashGet(options, 'stopPropagation')) {
		throw err;
	}
}
