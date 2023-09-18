<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';
	import type { FormField } from '$lib/types';
	import { lowerCase } from 'lodash-es';
	import { initialFormItemMisc } from '$lib/components/form/utils';

	export let label = '';
	export let prop = '';
	export let required = false;
	// This is a high-priority rules.
	// It will be used no matter whether we set the form rules or not.
	export let rules: FormField['rules'] = [];

	// Name is for the internal use.
	const name = `form-item-fake-name-${randomString(6)}`;
	const formItemMisc = initialFormItemMisc({ prop, name });

	const {
		messageInfoDerived,
		loadingDerived,
		validatingDerived,
		disabledDerived,
		readonlyDerived,
		requiredDerived,
		fieldFormRulesDerived,
		rulesDerived
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
