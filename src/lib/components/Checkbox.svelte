<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix } from '$lib/utils/calculators';
	import { writable } from 'svelte/store';
	import { initialFormItemFieldMisc } from '$lib/components/form/utils';
	import { FormRuleTrigger } from '$lib/types';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	const defaultName = `checkbox-${calcRandomCompNameSuffix()}`;

	export let name = defaultName;
	export let label = '';

	// Is a pure component, will not change the prop-checked straightly
	export let pure = false;
	// Consider that the component is a pure component. Will not straightly manipulate the props.
	export let checked = false;

	export let disabled = false;
	export let readonly = false;
	export let loading = false;

	let innerChecked = checked;
	$: innerChecked = checked;

	let inputEl: undefined | HTMLInputElement;

	const nameWatched = writable(name);
	$: nameWatched.set(name);
	const disabledWatched = writable(disabled);
	$: disabledWatched.set(disabled);
	const readonlyWatched = writable(readonly);
	$: readonlyWatched.set(readonly);
	const loadingWatched = writable(loading);
	$: loadingWatched.set(loading);
	const pureWatched = writable(pure);
	$: pureWatched.set(pure);

	const formItemFieldMisc = initialFormItemFieldMisc(
		{ disabledWatched, readonlyWatched, loadingWatched, nameWatched, defaultName, pureWatched },
		{ fieldType: 'input' }
	);
	const isFormItemFieldMiscValid = formItemFieldMisc.metrics.valid;
	const {
		finalNameDerived,
		finalLoadingDerived,
		finalReadonlyDerived,
		finalDisabledDerived,
		isNameOrFormFieldPropPresetDerived,
		isPuredDerived,
		miscClasses
	} = formItemFieldMisc.getters;

	function handleChange(e: Event) {
		if ($finalDisabledDerived || $finalReadonlyDerived) {
			if (inputEl) {
				inputEl.checked = innerChecked;
			}

			return;
		}

		innerChecked = (e.target as HTMLInputElement).checked;
		if ($isFormItemFieldMiscValid) {
			if (!$isNameOrFormFieldPropPresetDerived) {
				// If form context found, but field didn't set the 'prop' value.
				// Means: <FormItem prop=""> or <FormItem></FormItem>.
				// Revert the changes.
				innerChecked = (e.target as HTMLInputElement).checked = checked;

				return;
			}

			formItemFieldMisc.events.handleFieldSetValue(innerChecked, FormRuleTrigger.Change);
		}

		// A pure component shouldn't manipulate the prop straightly.
		if (!$isPuredDerived) {
			checked = innerChecked;
		}

		dispatch('change', innerChecked);
	}

	$: dynamicClasses = calcDynamicClasses(['checkbox', $$restProps.class, $miscClasses]);
</script>

<label class={dynamicClasses} for={name}>
	<input
		type="checkbox"
		name={$finalNameDerived}
		id={name}
		disabled={$finalDisabledDerived}
		readonly={$finalReadonlyDerived}
		checked={innerChecked}
		bind:this={inputEl}
		on:change={handleChange}
	/>
	{label}
</label>
