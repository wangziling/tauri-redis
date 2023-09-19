<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix } from '$lib/utils/calculators';
	import { createEventDispatcher, onMount, setContext } from 'svelte';
	import { contextStoreKey, createStore } from '$lib/components/form/context';
	import type { FormStoreState } from '$lib/types';
	import { FormLabelPosition } from '$lib/types';
	import { lowerCase } from 'lodash-es';

	export let name = `form-${calcRandomCompNameSuffix()}`;
	export let model: FormStoreState['model'] = {};
	export let labelPosition = FormLabelPosition.Top;
	export let useRestrictSetFieldValueMode: boolean = true;
	export let rules: FormStoreState['rules'] = {};

	$: dynamicClasses = calcDynamicClasses([
		'form',
		{
			['form--label-pos-' + lowerCase(labelPosition)]: labelPosition
		},
		$$restProps.class
	]);

	const dispatch = createEventDispatcher();
	const dispatchCallback: typeof dispatch = function dispatchCallback(...args) {
		return dispatch(...args);
	};

	const store = createStore({ dispatchCallback });

	$: store.mutations.setName(name);
	$: store.mutations.setModel(model);
	$: store.mutations.setRules(rules);
	$: store.mutations.setLabelPosition(labelPosition);
	$: store.mutations.setUseRestrictSetFieldValueMode(useRestrictSetFieldValueMode);

	setContext(contextStoreKey, store);

	onMount(function onMount() {
		// store.events
		// 	.handleValidateFields([{ prop: 'hosts' }], undefined, undefined, { trigger: [FormRuleTrigger.Change] })
		// 	.catch(function () {
		// 		console.log.apply(console, arguments);
		// 	});
	});

	// Exports.
	export const setFieldLoading = store.events.handleSetFieldLoading;
	export const validateFields = store.events.handleValidateFields;
	export const validate = store.events.handleValidate;
</script>

<form class={dynamicClasses} {name} action="#" on:submit|preventDefault|stopPropagation>
	<slot />
</form>
