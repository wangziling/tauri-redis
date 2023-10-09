<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix, parseNumLikeStr } from '$lib/utils/calculators';
	import { createEventDispatcher, onMount } from 'svelte';
	import { initialFormItemFieldMisc } from '$lib/components/form/utils';
	import { FormRuleTrigger } from '$lib/types';
	import { judgeValidNum, judgeValidNumLikeStr } from '$lib/utils/judgements';
	import { get as lodashGet } from 'lodash-es';
	import { writable } from 'svelte/store';

	const dispatch = createEventDispatcher();
	const defaultValue = 0;
	const defaultName = `input-number-${calcRandomCompNameSuffix()}`;

	const calcDisplayValue = function calcDisplayValue(value: number, precise: number) {
		return precise > 0 ? value.toFixed(precise) : value + '';
	};

	export let placeholder = '';
	export let disabled = false;
	export let readonly = false;
	export let loading = false;
	export let maximum = Number.MAX_SAFE_INTEGER;
	export let minimum = Number.MIN_SAFE_INTEGER;
	export let precise = 0; // 0 means Int.
	export let stepGap = 1;
	export let showStepOperations = true;

	// Is a pure component, will not change the prop-value straightly
	export let pure = false;
	// Consider that the component is a pure component. Will not straightly manipulate the props.
	export let value: number = defaultValue;

	export let name = defaultName;

	let innerValue: number = value;
	$: innerValue = value;

	let displayValue: string = calcDisplayValue(value, precise);
	$: {
		displayValue = calcDisplayValue(value, precise);
	}

	let inputEl: HTMLInputElement | undefined;

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
		{ fieldType: 'inputNumber' }
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

	$: isInnerValueValid = judgeValidNum(innerValue);
	$: isDisplayValueValid = judgeValidNumLikeStr(displayValue, { precise, maximum, minimum });
	$: isStepOperationPlusDisabled = innerValue === maximum;
	$: isStepOperationMinusDisabled = innerValue === minimum;
	$: stepOperationPlusDynamicClasses = calcDynamicClasses([
		'input__operation',
		'input__operation-step-plus',
		'fa',
		'fa-plus',
		{
			'input__operation--disabled': isStepOperationPlusDisabled
		}
	]);
	$: stepOperationMinusDynamicClasses = calcDynamicClasses([
		'input__operation',
		'input__operation-step-minus',
		'fa',
		'fa-minus',
		{
			'input__operation--disabled': isStepOperationMinusDisabled
		}
	]);

	$: dynamicClasses = calcDynamicClasses([
		'input',
		'input--type-number',
		{
			'input--disabled': $finalDisabledDerived,
			'input--readonly': $finalReadonlyDerived,
			'input--loading': $finalLoadingDerived,
			'input--invalid-num': !isDisplayValueValid
		},
		$miscClasses,
		$$restProps.class
	]);

	function input(
		val: string | number,
		options?: {
			silent: boolean;
		}
	) {
		if ($finalDisabledDerived || $finalReadonlyDerived) {
			if (inputEl) {
				inputEl.value = displayValue;
			}

			return;
		}

		displayValue = val + '';

		if (typeof val === 'number') {
			innerValue = val;
		} else {
			if (judgeValidNumLikeStr(val)) {
				innerValue = parseNumLikeStr(val);
			} else {
				if (inputEl) {
					innerValue = defaultValue;
					inputEl.value = displayValue;
				}

				return;
			}
		}

		if (!judgeValidNum(innerValue, { maximum, minimum })) {
			return;
		}

		const silent = lodashGet(options, 'silent');

		if ($isFormItemFieldMiscValid) {
			if (!$isNameOrFormFieldPropPresetDerived) {
				// If form context found, but field didn't set the 'prop' value.
				// Means: <FormItem prop=""> or <FormItem></FormItem>.
				// Revert the changes.
				displayValue = inputEl.value = calcDisplayValue(value, precise);
				innerValue = value;

				return;
			}

			if (!silent) {
				formItemFieldMisc.events.handleFieldSetValue(innerValue, FormRuleTrigger.Input);
			}
		}

		// A pure component shouldn't manipulate the prop straightly.
		if (!$isPuredDerived) {
			value = innerValue;
		}

		if (!silent) {
			dispatch('input', innerValue);
		}
	}

	function change(
		val: string | number,
		options?: {
			silent: boolean;
		}
	) {
		if ($finalDisabledDerived || $finalReadonlyDerived) {
			if (inputEl) {
				inputEl.value = displayValue;
			}

			return;
		}

		displayValue = val + '';

		const curValue = innerValue;

		if (typeof val === 'number') {
			innerValue = val;
		} else {
			if (judgeValidNumLikeStr(val)) {
				innerValue = parseNumLikeStr(val);
			} else {
				innerValue = defaultValue;
			}
		}

		if (innerValue > maximum) {
			innerValue = maximum;
		}

		if (innerValue < minimum) {
			innerValue = minimum;
		}

		if (precise > 0) {
			innerValue = parseNumLikeStr(innerValue.toFixed(precise));
		}

		if (curValue === innerValue) {
			displayValue = calcDisplayValue(innerValue, precise);

			return;
		}

		if (judgeValidNum(innerValue, { maximum, minimum })) {
			return;
		}

		const silent = lodashGet(options, 'silent');
		if ($isFormItemFieldMiscValid) {
			if (!$isNameOrFormFieldPropPresetDerived) {
				// If form context found, but field didn't set the 'prop' value.
				// Means: <FormItem prop=""> or <FormItem></FormItem>.
				// Revert the changes.
				inputEl.value = displayValue = calcDisplayValue(value, precise);
				innerValue = value;

				return;
			}

			if (!silent) {
				formItemFieldMisc.events.handleFieldSetValue(innerValue, FormRuleTrigger.Change);
			}
		}

		// A pure component shouldn't manipulate the prop straightly.
		if (!$isPuredDerived) {
			value = innerValue;
		}

		displayValue = calcDisplayValue(innerValue, precise);
		if (!silent) {
			dispatch('change', innerValue);
		}
	}

	function handleInput(e: Event) {
		return input((e.target as HTMLInputElement).value);
	}

	function handleChange(e: Event) {
		return change((e.target as HTMLInputElement).value);
	}

	function handleFocus(e: Event) {
		if (inputEl) {
			inputEl.value = displayValue;
		}

		if ($finalDisabledDerived || $finalReadonlyDerived) {
			return;
		}

		if ($isFormItemFieldMiscValid) {
			formItemFieldMisc.events.handleFieldFocus(e);
		}

		dispatch('focus', e);
	}

	function handleBlur(e: Event) {
		if (inputEl) {
			inputEl.value = displayValue;
		}

		if ($finalDisabledDerived || $finalReadonlyDerived) {
			return;
		}

		const curValue = innerValue;
		if (!isInnerValueValid) {
			innerValue = defaultValue;
		}
		if (innerValue > maximum) {
			innerValue = maximum;
		}

		if (innerValue < minimum) {
			innerValue = minimum;
		}

		if (innerValue !== curValue) {
			change(innerValue);
		}

		displayValue = calcDisplayValue(innerValue, precise);

		if ($isFormItemFieldMiscValid) {
			formItemFieldMisc.events.handleFieldBlur(e);
		}

		dispatch('blur', e);
	}

	function handleExecStepGapMinus() {
		if (inputEl) {
			inputEl.value = displayValue;
		}

		if (!isInnerValueValid) {
			innerValue = defaultValue;
		}

		if (!showStepOperations) {
			return;
		}

		if (isStepOperationMinusDisabled) {
			return;
		}

		return change(innerValue - stepGap);
	}

	function handleExecStepGapPlus() {
		if (inputEl) {
			inputEl.value = displayValue;
		}

		if (!isInnerValueValid) {
			innerValue = defaultValue;
		}

		if (!showStepOperations) {
			return;
		}

		if (isStepOperationPlusDisabled) {
			return;
		}

		return change(innerValue + stepGap);
	}

	onMount(function () {
		change(displayValue, { silent: true });
	});
</script>

<div class={dynamicClasses}>
	<div class="input-wrapper">
		<div class="input__prefix">
			<slot name="prefix" />
		</div>
		<div class="input__input">
			<input
				type="text"
				class="input__input-el"
				{placeholder}
				disabled={$finalDisabledDerived}
				readonly={$finalReadonlyDerived}
				value={displayValue}
				name={$finalNameDerived}
				id={name}
				bind:this={inputEl}
				on:input={handleInput}
				on:focus={handleFocus}
				on:blur={handleBlur}
				on:change={handleChange}
			/>
		</div>
		<div class="input__suffix">
			{#if showStepOperations}
				<div class="input__operation-group">
					<slot name="suffix" />
					<span class={stepOperationMinusDynamicClasses} role="button" on:click={handleExecStepGapMinus} />
					<span class={stepOperationPlusDynamicClasses} role="button" on:click={handleExecStepGapPlus} />
				</div>
			{:else}
				<slot name="suffix" />
			{/if}
		</div>
	</div>
</div>
