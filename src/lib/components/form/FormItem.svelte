<script lang="ts">
	import { calcDynamicClasses, randomString } from '$lib/utils/calculators';
	import type { FormField } from '$lib/types';
	import { lowerCase } from 'lodash-es';
	import { tick } from 'svelte';
	import { initialFormItemMisc } from '$lib/components/form/utils';

	export let label = '';
	export let prop = '';
	export let required = false;
	export let name = `form-item-fake-name-${randomString(6)}`;
	export let rules: FormField['rules'] = [];

	const formItemMisc = initialFormItemMisc({ prop, name }, { required, rules });

	const { messageInfoDerived, loadingDerived, validatingDerived, disabledDerived, readonlyDerived, requiredDerived } =
		formItemMisc.state;

	$: isMessageInfoValid = !!($messageInfoDerived && $messageInfoDerived.message);

	$: innerRules = required
		? rules.some(function (rule) {
				return rule.required;
		  })
			? rules
			: (rules.push({ required: true }), rules)
		: rules;

	$: innerRequired = rules.some(function (rule) {
		return rule.required;
	});

	$: {
		tick().then(function updateFieldOtherMetrics() {
			formItemMisc.utils.updateFieldOtherMetrics({ rules: innerRules, required: innerRequired });
		});
	}

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
