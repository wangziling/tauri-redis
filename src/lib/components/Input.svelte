<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix } from '$lib/utils/calculators';
	import { createEventDispatcher } from 'svelte';
	import { initialFormItemFieldMisc } from '$lib/components/form/utils';
	import { FormRuleTrigger } from '$lib/types';

	const dispatch = createEventDispatcher();

	export let placeholder = '';
	export let disabled = false;
	export let readonly = false;
	export let loading = false;
	// Consider that the component is a pure component. Will not straightly manipulate the props.
	export let value = '';
	export let type = 'text';
	export let name = `input-${calcRandomCompNameSuffix()}`;

	const formItemFieldMisc = initialFormItemFieldMisc({ fieldType: 'input' });

	let miscName = '';
	if (formItemFieldMisc) {
		formItemFieldMisc.state.bindings.prop.subscribe(function (value) {
			miscName = value;
		});
	}

	let miscDisabled = disabled;
	if (formItemFieldMisc) {
		formItemFieldMisc.state.bindings.disabled.subscribe(function (value) {
			miscDisabled = value;
		});
	}

	let miscReadonly = readonly;
	if (formItemFieldMisc) {
		formItemFieldMisc.state.bindings.readonly.subscribe(function (value) {
			miscReadonly = value;
		});
	}

	let miscLoading = loading;
	if (formItemFieldMisc) {
		formItemFieldMisc.state.bindings.loading.subscribe(function (value) {
			miscLoading = value;
		});
	}

	$: innerDisabled = miscDisabled || disabled;
	$: innerReadonly = miscReadonly || readonly;
	$: innerLoading = miscLoading || loading;
	$: innerName = miscName || name;

	$: dynamicClasses = calcDynamicClasses([
		'input',
		{
			'input--disabled': innerDisabled,
			'input--readonly': innerReadonly,
			'input--loading': innerLoading
		},
		$$restProps.class
	]);

	function handleInput(e: Event) {
		if (innerDisabled || innerReadonly) {
			return;
		}

		const curValue = (e.target as HTMLInputElement).value;
		if (formItemFieldMisc) {
			formItemFieldMisc.events.handleFieldSetValue(curValue, FormRuleTrigger.Input);
		}

		// A pure component shouldn't manipulate the prop straightly.
		// value = curValue;

		dispatch('input', value);
	}

	function handleChange(e: Event) {
		if (innerDisabled || innerReadonly) {
			return;
		}

		const curValue = (e.target as HTMLInputElement).value;
		if (formItemFieldMisc) {
			formItemFieldMisc.events.handleFieldSetValue(curValue, FormRuleTrigger.Change);
		}

		// A pure component shouldn't manipulate the prop straightly.
		// value = curValue;

		dispatch('change', value);
	}

	function handleFocus(e: Event) {
		if (innerDisabled || innerLoading) {
			return;
		}

		if (formItemFieldMisc) {
			formItemFieldMisc.events.handleFieldFocus(e);
		}

		dispatch('focus', e);
	}

	function handleBlur(e: Event) {
		if (innerDisabled || innerLoading) {
			return;
		}

		if (formItemFieldMisc) {
			formItemFieldMisc.events.handleFieldBlur(e);
		}

		dispatch('blur', e);
	}
</script>

<input
	{type}
	class={dynamicClasses}
	{placeholder}
	disabled={innerDisabled}
	readonly={innerReadonly}
	{value}
	name={innerName}
	id={name}
	on:input={handleInput}
	on:focus={handleFocus}
	on:blur={handleBlur}
	on:change={handleChange}
/>
