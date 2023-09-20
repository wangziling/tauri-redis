<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix } from '$lib/utils/calculators';
	import type { FormField } from '$lib/types';
	import { lowerCase } from 'lodash-es';
	import { initialFormItemMisc } from '$lib/components/form/utils';
	import { contextItemStoreKey, createItemStore } from '$lib/components/form/context';
	import { setContext } from 'svelte';
	import { readable } from 'svelte/store';

	export let label = '';
	export let prop = '';
	export let required = false;
	// This is a high-priority rules.
	// It will be used no matter whether we set the form rules or not.
	export let rules: FormField['rules'] = [];
	export let useRestrictSetFieldValueMode: boolean = true;

	// Name is for the internal use.
	const name = `form-item-${calcRandomCompNameSuffix()}`;

	const readableUseRestrictSetFieldValueMode = readable(useRestrictSetFieldValueMode);
	const formItemMisc = initialFormItemMisc(
		{ prop, name },
		{ useRestrictSetFieldValueMode: readableUseRestrictSetFieldValueMode }
	);

	const {
		propDerived,
		messageInfoDerived,
		loadingDerived,
		validatingDerived,
		disabledDerived,
		readonlyDerived,
		requiredDerived,
		// fieldFormRulesDerived,
		// rulesDerived,
		valueDerived
	} = formItemMisc.state;

	$: isMessageInfoValid = !!($messageInfoDerived && $messageInfoDerived.message);

	$: formItemMisc.mutations.setFieldRequired(required);
	$: formItemMisc.mutations.setFieldRules(rules);

	$: dynamicClasses = calcDynamicClasses([
		'form-item',
		{
			['form-item__prop-' + prop]: prop,
			'form-item--required': $requiredDerived,
			'form-item--loading': $loadingDerived,
			'form-item--validating': $validatingDerived,
			'form-item--disabled': $disabledDerived,
			'form-item--readonly': $readonlyDerived
		},
		isMessageInfoValid ? 'form-item--message-' + lowerCase($messageInfoDerived.type) : '',
		$$restProps.class
	]);

	const contextItemStore = createItemStore();

	$: contextItemStore.mutations.setName(name);
	$: contextItemStore.mutations.setBindings({
		value: valueDerived,
		validating: validatingDerived,
		readonly: readonlyDerived,
		disabled: disabledDerived,
		loading: loadingDerived,
		prop: propDerived
	});
	$: contextItemStore.mutations.setEvents({
		handleFieldBlur: formItemMisc.events.handleFieldBlur,
		handleFieldFocus: formItemMisc.events.handleFieldFocus,
		handleFieldSetValue: formItemMisc.events.handleFieldSetValue
	});
	$: contextItemStore.mutations.setMutations({
		setFieldDisabled: formItemMisc.mutations.setFieldDisabled,
		setFieldReadonly: formItemMisc.mutations.setFieldReadonly,
		setFieldLoading: formItemMisc.mutations.setFieldLoading
	});

	setContext(contextItemStoreKey, contextItemStore);
</script>

<div class={dynamicClasses}>
	<div class="form-item-wrapper">
		<label class="form-item-label" for={name}>
			{#if label}
				{@html label}
			{:else}
				<slot name="label" />
			{/if}
		</label>
		<div class="form-item-content" id={name}>
			<slot />
		</div>
	</div>
	<div class="form-item-message">
		{#if isMessageInfoValid}
			{@html $messageInfoDerived.message}
		{/if}
	</div>
</div>
