import MessageManagerComp from '$lib/components/notification/MessageManager.svelte';
import { get, type Writable, writable } from 'svelte/store';
import { ComponentsManualRenderingBaseEvents } from '$lib/utils/components';
import type {
	MessageManagerAppendMessageParams,
	MessageManagerMessages,
	MessageManagerPlacement,
	TArrayMember
} from '$lib/types';
import { randomString } from '$lib/utils/calculators';
import type Message from '$lib/components/notification/Message.svelte';
import { crossfade } from 'svelte/transition';
import { quintOut } from 'svelte/easing';
import { flip } from 'svelte/animate';

export function createMessageManagerStore(initialState: MessageManagerMessages) {
	const { subscribe, update } = writable(initialState) as Writable<MessageManagerMessages>;

	const result = {
		subscribe,
		append(message: TArrayMember<MessageManagerMessages>) {
			const newMessage = {
				id: `message-${randomString(10)}`,
				...message
			} as TArrayMember<MessageManagerMessages>;

			const duration = newMessage.duration;
			if (typeof duration === 'number' && !Number.isNaN(duration) && duration !== Infinity) {
				setTimeout(function timeout() {
					result.remove(newMessage.id);
				}, duration);
			}

			update(function (mss) {
				return [...mss, newMessage];
			});
		},
		remove(id: TArrayMember<MessageManagerMessages>['id']) {
			update(function (mss) {
				return mss.filter(function (ms) {
					return ms.id !== id;
				});
			});
		}
	};

	return result;
}

export function createMessageManagerFade() {
	// Copy from https://learn.svelte.dev/tutorial/animate.
	// Thanks.
	const [messageIn, messageOut] = crossfade({
		duration: (d) => Math.sqrt(d * 200),

		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 300,
				easing: quintOut,
				css: (t) => `
				transform: ${transform} scale(${t});
				opacity: ${t};
			`
			};
		}
	});

	return {
		messageIn,
		messageOut,
		messageFlip: flip
	};
}

export class MessageManager extends ComponentsManualRenderingBaseEvents {
	private ins = writable(null as MessageManagerComp | null);

	private init() {
		this.ins.set(
			new MessageManagerComp({
				target: document.body
			})
		);
	}

	append(params?: Partial<MessageManagerAppendMessageParams>): Message {
		if (!get(this.ins)) {
			this.init();
		}

		return get(this.ins).append(params);
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
