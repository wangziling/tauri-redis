import { messageManager } from '$lib/components/notification/message';
import { MessageType } from '$lib/types';
import { get as lodashGet } from 'lodash-es';
import { translator } from 'tauri-redis-plugin-translation-api';

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

export function invokeOperationSuccessHandle(res?: any) {
	messageManager.append({
		content: translator.translate('operation succeed|Operation succeed.'),
		type: MessageType.Success,
		closable: true
	});

	return res;
}
