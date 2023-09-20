<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix, parseNumLikeStr } from '$lib/utils/calculators';
	import { createEventDispatcher, onMount } from 'svelte';
	import { initialFormItemFieldMisc } from '$lib/components/form/utils';
	import { FormRuleTrigger } from '$lib/types';
	import { judgeValidNum, judgeValidNumLikeStr } from '$lib/utils/judgements';
	import { get as lodashGet } from 'lodash-es';

	const dispatch = createEventDispatcher();
	const defaultValue = 0;

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

	// Consider that the component is a pure component. Will not straightly manipulate the props.
	export let value: number = defaultValue;
	export let name = `input-number-${calcRandomCompNameSuffix()}`;

	let innerValue: number = value;
	$: innerValue = value;

	let displayValue: string = calcDisplayValue(value, precise);
	let inputEl: HTMLInputElement | undefined;
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
		'input--type-number',
		{
			'input--disabled': innerDisabled,
			'input--readonly': innerReadonly,
			'input--loading': innerLoading,
			'input--invalid-num': !isDisplayValueValid
		},
		$$restProps.class
	]);

	function input(val: string | number, options?: { silent: boolean }) {
		if (innerDisabled || innerReadonly) {
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
					inputEl.value = displayValue;
				}

				return;
			}
		}

		const silent = lodashGet(options, 'silent');

		if (formItemFieldMisc && !silent) {
			formItemFieldMisc.events.handleFieldSetValue(innerValue, FormRuleTrigger.Input);
		}

		// A pure component shouldn't manipulate the prop straightly.
		// value = curValue;

		if (!silent) {
			dispatch('input', innerValue);
		}
	}

	function change(val: string | number, options?: { silent: boolean }) {
		if (innerDisabled || innerReadonly) {
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

		const silent = lodashGet(options, 'silent');
		if (formItemFieldMisc && !silent) {
			formItemFieldMisc.events.handleFieldSetValue(innerValue, FormRuleTrigger.Change);
		}

		// A pure component shouldn't manipulate the prop straightly.
		// value = curValue;

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
		if (innerDisabled || innerReadonly) {
			if (inputEl) {
				inputEl.value = displayValue;
			}

			return;
		}

		if (formItemFieldMisc) {
			formItemFieldMisc.events.handleFieldFocus(e);
		}

		dispatch('focus', e);
	}

	function handleBlur(e: Event) {
		if (innerDisabled || innerReadonly) {
			if (inputEl) {
				inputEl.value = displayValue;
			}

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

		if (formItemFieldMisc) {
			formItemFieldMisc.events.handleFieldBlur(e);
		}

		dispatch('blur', e);
	}

	function handleExecStepGapMinus() {
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
				disabled={innerDisabled}
				readonly={innerReadonly}
				value={displayValue}
				name={innerName}
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
					<span class={stepOperationMinusDynamicClasses} role="button" on:click={handleExecStepGapMinus} />
					<span class={stepOperationPlusDynamicClasses} role="button" on:click={handleExecStepGapPlus} />
				</div>
			{/if}
			<slot name="suffix" />
		</div>
	</div>
</div>
