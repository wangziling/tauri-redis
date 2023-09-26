import MessageManagerComp from '$lib/components/notification/MessageManager.svelte';
import { get, writable } from 'svelte/store';
import { ComponentsManualRenderingBaseEvents } from '$lib/utils/components';
import type { MessageManagerAppendMessageParams, MessageManagerPlacement } from '$lib/types';
import { randomString } from '$lib/utils/calculators';
import type Message from '$lib/components/notification/Message.svelte';

export class MessageManager extends ComponentsManualRenderingBaseEvents {
	private ins = writable(null as MessageManagerComp | null);

	private init() {
		const target = document.body;

		const ins = new MessageManagerComp({
			target
		});

		ins.$on('empty', () => {
			ins.$destroy();
			this.ins.set(null);
		});

		this.ins.set(ins);
	}

	appendMessage(params?: Partial<MessageManagerAppendMessageParams>): Message {
		if (!get(this.ins)) {
			this.init();
		}

		const id = `message-${randomString(10)}`;
		return get(this.ins).appendMessage({
			...(params || {}),
			id
		});
	}

	setPlacement(placement: MessageManagerPlacement) {
		if (!get(this.ins)) {
			this.init();
		}

		get(this.ins).setPlacement(placement);

		return this;
	}
}

export const messageManager = new MessageManager();
