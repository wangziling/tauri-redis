<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { calcDynamicClasses } from '$lib/utils/calculators';

	export let type: string = '';
	export let content: string = '';
	export let disabled = false;

	$: dynamicClasses = calcDynamicClasses([
		'btn',
		{
			['btn--' + type]: type
		},
		$$restProps.class
	]);

	const dispatch = createEventDispatcher();

	function handleClick() {
		dispatch.apply(this, ['click', ...arguments]);
	}
</script>

<button class={dynamicClasses} {disabled} on:click|stopPropagation={handleClick}>
	{#if content}
		{@html content}
	{:else}
		<slot />
	{/if}
</button>
