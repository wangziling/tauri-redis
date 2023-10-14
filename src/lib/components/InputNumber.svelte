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
	export let disableManualInputWhenShowStepOperations = false;
	export let size: 'default' | 'mini' | 'small' = 'default';

	// Is a pure component, will not change the prop-value straightly
	export let pure = false;
	// Consider that the component is a pure component. Will not straightly manipulate the props.
	export let value: number = defaultValue;

	export let name = defaultName;

	let displayValue: string = calcDisplayValue(value, precise);

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
	const valueWatched = writable(value);
	$: valueWatched.set(value);

	const formItemFieldMisc = initialFormItemFieldMisc<typeof value>(
		{ disabledWatched, readonlyWatched, loadingWatched, nameWatched, defaultName, pureWatched, valueWatched },
		{ fieldType: 'inputNumber' }
	);
	const isFormItemFieldMiscValid = formItemFieldMisc.metrics.valid;
	const {
		finalNameDerived,
		finalLoadingDerived,
		finalReadonlyDerived,
		finalDisabledDerived,
		finalValueDerived,
		isNameOrFormFieldPropPresetDerived,
		isPuredDerived,
		miscClasses
	} = formItemFieldMisc.getters;

	$: isInnerValueValid = judgeValidNum($finalValueDerived);
	$: isDisplayValueValid = judgeValidNumLikeStr(displayValue, { precise, maximum, minimum });
	$: isStepOperationPlusDisabled = $finalValueDerived === maximum;
	$: isStepOperationMinusDisabled = $finalValueDerived === minimum;
	$: isInputElDisabledByStepOperations = disableManualInputWhenShowStepOperations && showStepOperations;
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
			'input--invalid-num': !isDisplayValueValid,
			'input--disabled-by-step-operations': isInputElDisabledByStepOperations,
			['input--size-' + size]: size
		},
		$miscClasses,
		$$restProps.class
	]);

	$: displayValue = calcDisplayValue($finalValueDerived, precise);

	function input(
		val: string | number,
		options?: Partial<{
			silent: boolean;
			byStepOperations: boolean;
		}>
	) {
		if (
			$finalDisabledDerived ||
			$finalReadonlyDerived ||
			(isInputElDisabledByStepOperations && !lodashGet(options, 'byStepOperations'))
		) {
			if (inputEl) {
				inputEl.value = displayValue;
			}

			return;
		}

		displayValue = val + '';

		if (typeof val === 'number') {
			valueWatched.set(val);
		} else {
			if (judgeValidNumLikeStr(val)) {
				valueWatched.set(parseNumLikeStr(val));
			} else {
				if (inputEl) {
					valueWatched.set(defaultValue);
					inputEl.value = displayValue;
				}

				return;
			}
		}

		let validValue = $valueWatched;

		if (validValue > maximum) {
			validValue = maximum;
		}

		if (validValue < minimum) {
			validValue = minimum;
		}

		if (precise > 0) {
			validValue = parseNumLikeStr($finalValueDerived.toFixed(precise));
		}

		if (!judgeValidNum(validValue, { maximum, minimum })) {
			return;
		}

		const silent = lodashGet(options, 'silent');

		if ($isFormItemFieldMiscValid) {
			if (!$isNameOrFormFieldPropPresetDerived) {
				// If form context found, but field didn't set the 'prop' value.
				// Means: <FormItem prop=""> or <FormItem></FormItem>.
				// Revert the changes.
				displayValue = inputEl.value = calcDisplayValue(value, precise);
				valueWatched.set(value);

				return;
			}

			if (!silent) {
				formItemFieldMisc.events.handleFieldSetValue(validValue, FormRuleTrigger.Input);
			}
		}

		// A pure component shouldn't manipulate the prop straightly.
		if (!$isPuredDerived) {
			value = validValue;
		}

		if (!silent) {
			dispatch('input', validValue);
		}
	}

	function change(
		val: string | number,
		options?: {
			silent: boolean;
		}
	) {
		if (
			$finalDisabledDerived ||
			$finalReadonlyDerived ||
			(isInputElDisabledByStepOperations && !lodashGet(options, 'byStepOperations'))
		) {
			if (inputEl) {
				inputEl.value = displayValue;
			}

			return;
		}

		displayValue = val + '';

		const curValue = $valueWatched;

		if (typeof val === 'number') {
			valueWatched.set(val);
		} else {
			if (judgeValidNumLikeStr(val)) {
				valueWatched.set(parseNumLikeStr(val));
			} else {
				valueWatched.set(defaultValue);
			}
		}

		if ($valueWatched > maximum) {
			valueWatched.set(maximum);
		}

		if ($valueWatched < minimum) {
			valueWatched.set(minimum);
		}

		if (precise > 0) {
			valueWatched.set(parseNumLikeStr($finalValueDerived.toFixed(precise)));
		}

		if (curValue === $valueWatched) {
			displayValue = calcDisplayValue($finalValueDerived, precise);

			return;
		}

		if (judgeValidNum($valueWatched, { maximum, minimum })) {
			return;
		}

		const silent = lodashGet(options, 'silent');
		if ($isFormItemFieldMiscValid) {
			if (!$isNameOrFormFieldPropPresetDerived) {
				// If form context found, but field didn't set the 'prop' value.
				// Means: <FormItem prop=""> or <FormItem></FormItem>.
				// Revert the changes.
				inputEl.value = displayValue = calcDisplayValue(value, precise);
				valueWatched.set(value);

				return;
			}

			if (!silent) {
				formItemFieldMisc.events.handleFieldSetValue($valueWatched, FormRuleTrigger.Change);
			}
		}

		// A pure component shouldn't manipulate the prop straightly.
		if (!$isPuredDerived) {
			value = $finalValueDerived;
		}

		displayValue = calcDisplayValue($finalValueDerived, precise);
		if (!silent) {
			dispatch('change', $finalValueDerived);
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

		if ($finalDisabledDerived || $finalReadonlyDerived || isInputElDisabledByStepOperations) {
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

		if ($finalDisabledDerived || $finalReadonlyDerived || isInputElDisabledByStepOperations) {
			return;
		}

		const curValue = $valueWatched;
		if (!isInnerValueValid) {
			valueWatched.set(defaultValue);
		}
		if ($valueWatched > maximum) {
			valueWatched.set(maximum);
		}

		if ($valueWatched < minimum) {
			valueWatched.set(minimum);
		}

		if ($valueWatched !== curValue) {
			change($finalValueDerived);
		}

		displayValue = calcDisplayValue($finalValueDerived, precise);

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
			valueWatched.set(defaultValue);
		}

		if (!showStepOperations) {
			return;
		}

		if (isStepOperationMinusDisabled) {
			return;
		}

		return input($finalValueDerived - stepGap, { byStepOperations: true });
	}

	function handleExecStepGapPlus() {
		if (inputEl) {
			inputEl.value = displayValue;
		}

		if (!isInnerValueValid) {
			valueWatched.set(defaultValue);
		}

		if (!showStepOperations) {
			return;
		}

		if (isStepOperationPlusDisabled) {
			return;
		}

		return input($finalValueDerived + stepGap, { byStepOperations: true });
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
				disabled={$finalDisabledDerived || isInputElDisabledByStepOperations}
				readonly={$finalReadonlyDerived || isInputElDisabledByStepOperations}
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
