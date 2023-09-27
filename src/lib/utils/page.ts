import { messageManager } from '$lib/components/notification/message';
import { MessageType } from '$lib/types';

export function invokeErrorHandle(err: Error) {
	messageManager.append({
		content: err.message,
		type: MessageType.Error,
		closable: true
	});

	throw err;
}
