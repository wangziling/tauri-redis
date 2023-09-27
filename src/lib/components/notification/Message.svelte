<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';
	import { type MessageItem, MessageType, type TArrayOrPrimitive } from '$lib/types';
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let closable: MessageItem['closable'] = false;
	export let content: MessageItem['content'] = '';
	export let type: MessageItem['type'] = MessageType.Info;
	export let duration: MessageItem['duration'] = 5000; // Milliseconds.
	export let id: MessageItem['id'] = `message-${randomString(10)}`;
	export let plain: MessageItem['plain'] = false;

	export let visible = true;

	function handleClose() {
		visible = false;
		dispatch('close', { visible, id });
	}

	function calcIconClass(t: typeof type): TArrayOrPrimitive<string> {
		switch (t) {
			case MessageType.Info: {
				return 'fa fa-circle-info';
			}
			case MessageType.Success: {
				return 'fa fa-circle-check';
			}
			case MessageType.Warning: {
				return 'fa fa-circle-exclamation';
			}
			case MessageType.Error: {
				return 'fa fa-circle-xmark';
			}
			case MessageType.Loading: {
				return 'fa fa-spinner fa-spin';
			}
		}

		return 'fa fa-question';
	}

	$: dynamicClasses = calcDynamicClasses([
		'message',
		{
			'message--closable': closable,
			['message--type-' + type.toLowerCase()]: type,
			'message--visible': visible,
			'message--plain': plain
		},
		$$restProps.class
	]);

	$: dynamicIconClasses = calcDynamicClasses(['message__icon', calcIconClass(type)]);

	onMount(function onMount() {
		if (typeof duration === 'number' && !Number.isNaN(duration) && duration !== Infinity) {
			setTimeout(function () {
				handleClose();
			}, duration);
		}
	});
</script>

<div class={dynamicClasses} {id}>
	<div class="message-wrapper">
		<div class="message__aside">
			<div class={dynamicIconClasses} />
		</div>
		<div class="message__content">
			{@html content}
		</div>
		<div class="message__operations">
			{#if closable}
				<span class="message__operation message__operation-close fa fa-xmark" on:click={handleClose} role="button" />
			{/if}
		</div>
	</div>
</div>
