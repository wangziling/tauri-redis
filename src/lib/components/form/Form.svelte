<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix } from '$lib/utils/calculators';
	import { createEventDispatcher, onMount, setContext } from 'svelte';
	import { contextStoreKey, createStore } from '$lib/components/form/context';
	import type { FormStoreState } from '$lib/types';
	import { FormLabelPosition } from '$lib/types';
	import { lowerCase } from 'lodash-es';
	import { writable } from 'svelte/store';

	export let name = `form-${calcRandomCompNameSuffix()}`;
	export let model: FormStoreState['model'] = writable({});
	export let labelPosition = FormLabelPosition.Top;
	export let useRestrictSetFieldValueMode: boolean = true;
	export let disabled: boolean = false;
	export let readonly: boolean = false;
	export let rules: FormStoreState['rules'] = writable({});

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
	$: store.mutations.setDisabled(disabled);
	$: store.mutations.setReadonly(readonly);

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
	export const resetFieldsValidation = store.events.handleResetFieldsValidation;
	export const resetValidation = store.events.handleResetValidation;
</script>

<form class={dynamicClasses} {name} action="#" on:submit|preventDefault|stopPropagation>
	<div class="form__caption">
		<slot name="caption" />
	</div>
	<div class="form__main">
		<slot />
	</div>
	<div class="form__footer">
		<slot name="footer" />
	</div>
</form>
