<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let placeholder = '';
	export let disabled = false;
	export let value = '';
	export let type = 'text';
	export let name = `input-${randomString(6)}`;

	let innerValue = value;

	$: dynamicClasses = calcDynamicClasses([
		'input',
		{
			'input--disabled': disabled
		},
		$$restProps.class
	]);

	$: {
		innerValue = value;
	}

	function handleInput(e: Event) {
		if (disabled) {
			return;
		}

		innerValue = (e.target as HTMLInputElement).value;
		dispatch('input', innerValue);
	}

	function handleFocus(e: Event) {
		if (disabled) {
			return;
		}

		dispatch('focus', e);
	}

	function handleBlur(e: Event) {
		if (disabled) {
			return;
		}

		dispatch('blur', e);
	}
</script>

<input
	{type}
	class={dynamicClasses}
	{placeholder}
	{disabled}
	value={innerValue}
	{name}
	id={name}
	on:input={handleInput}
	on:focus={handleFocus}
	on:blur={handleBlur}
/>
