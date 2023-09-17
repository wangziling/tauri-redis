<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';
	import { onMount, setContext } from 'svelte';
	import { contextStoreKey, createStore } from '$lib/components/form/context';
	import type { FormStoreState } from '$lib/types';

	export let name = `form-${randomString(6)}`;
	export let model: FormStoreState['model'] = {};
	export let labelPosition: 'top' | 'left' = 'top';

	$: dynamicClasses = calcDynamicClasses([
		'form',
		{
			['form--label-pos-' + labelPosition]: labelPosition
		},
		$$restProps.class
	]);

	const store = createStore();
	$: {
		store.mutations.setName(name);
		store.mutations.setModel(model);
	}

	setContext(contextStoreKey, store);

	onMount(function onMount() {
		// store.utils.validate().catch(function() {
		// 	console.log.apply(console, arguments);
		// });
	});
</script>

<form class={dynamicClasses} {name} action="#" on:submit|preventDefault|stopPropagation>
	<slot />
</form>
