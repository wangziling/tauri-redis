<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';
	import { type MessageManagerMessages, MessageManagerPlacement, type TArrayMember } from '$lib/types';
	import Message from '$lib/components/notification/Message.svelte';
	import { type Writable, writable } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';

	export let placement: MessageManagerPlacement = MessageManagerPlacement.Top;
	export let id: string = `message-manager-${randomString(10)}`;
	const placementWatched: Writable<MessageManagerPlacement> = writable(placement);
	$: placementWatched.set(placement);

	const messages: Writable<MessageManagerMessages> = writable([]);

	const dispatcher = createEventDispatcher();

	export const appendMessage = function appendMessage(message: TArrayMember<MessageManagerMessages>) {
		return messages.update(function (messages) {
			messages.push(message);

			return messages;
		});
	};

	export const setPlacement = function setPlacement(pl: MessageManagerPlacement) {
		return placementWatched.set(pl);
	};

	function handleItemClose(id: TArrayMember<MessageManagerMessages>['id']) {
		messages.update(function (messages) {
			const idx = messages.findIndex(function (ms) {
				return ms.id === id;
			});
			if (idx !== -1) {
				messages.splice(idx, 1);
			}

			return messages;
		});

		if (!$messages.length) {
			dispatcher('empty');
		}
	}

	$: dynamicClasses = calcDynamicClasses([
		'message-manager',
		'message-manager--placement-' + $placementWatched.toLowerCase(),
		$$restProps.class
	]);
</script>

<div class={dynamicClasses} {id}>
	<div class="message-manager-wrapper">
		{#each $messages as message}
			<Message {...message} on:close={() => handleItemClose(message.id)} />
		{/each}
	</div>
</div>
