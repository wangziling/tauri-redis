<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';
	import { onMount, setContext } from 'svelte';
	import { contextStoreKey, createStore } from '$lib/components/form/context';
	import type { FormStoreState } from '$lib/types';
	import { FormLabelPosition } from '$lib/types';
	import { lowerCase } from 'lodash-es';

	export let name = `form-${randomString(6)}`;
	export let model: FormStoreState['model'] = {};
	export let labelPosition = FormLabelPosition.Top;
	export let rules: FormStoreState['rules'] = {};

	$: dynamicClasses = calcDynamicClasses([
		'form',
		{
			['form--label-pos-' + lowerCase(labelPosition)]: labelPosition
		},
		$$restProps.class
	]);

	const store = createStore();

	$: store.mutations.setName(name);
	$: store.mutations.setModel(model);
	$: store.mutations.setRules(rules);
	$: store.mutations.setLabelPosition(labelPosition);

	setContext(contextStoreKey, store);

	onMount(function onMount() {
		// store.utils.validateFieldsWithTrigger([{ prop: 'hosts' }], [FormRuleTrigger.Input]).catch(function () {
		// 	console.log.apply(console, arguments);
		// });
	});

	// Exports.
	export const setFieldLoading = store.mutations.setFieldLoading;
	export const validateFields = store.utils.validateFields;
	export const validate = store.utils.validate;
</script>

<form class={dynamicClasses} {name} action="#" on:submit|preventDefault|stopPropagation>
	<slot />
</form>
