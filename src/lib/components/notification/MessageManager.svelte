<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';
	import { type MessageManagerMessages, MessageManagerPlacement } from '$lib/types';
	import Message from '$lib/components/notification/Message.svelte';
	import { type Writable, writable } from 'svelte/store';
	import { createMessageManagerFade, createMessageManagerStore } from '$lib/components/notification/message';

	const messages = createMessageManagerStore([] as MessageManagerMessages);
	const { messageIn, messageOut, messageFlip } = createMessageManagerFade();

	export let placement: MessageManagerPlacement = MessageManagerPlacement.Top;
	export let id: string = `message-manager-${randomString(10)}`;
	const placementWatched: Writable<MessageManagerPlacement> = writable(placement);
	$: placementWatched.set(placement);

	export const append = messages.append;
	export const remove = messages.remove;
	export const setPlacement = placementWatched.set;

	$: dynamicClasses = calcDynamicClasses([
		'message-manager',
		'message-manager--placement-' + $placementWatched.toLowerCase(),
		$$restProps.class
	]);
</script>

<div class={dynamicClasses} {id}>
	<div class="message-manager-wrapper">
		{#each $messages as message (message.id)}
			<div
				class="message-container"
				in:messageIn|global={{ key: message.id }}
				out:messageOut|global={{ key: message.id }}
				animate:messageFlip={{ duration: 300 }}
			>
				<Message {...message} on:close={() => messages.remove(message.id)} />
			</div>
		{/each}
	</div>
</div>
