<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix } from '$lib/utils/calculators';
	import { createEventDispatcher } from 'svelte';
	import { initialFormItemFieldMisc } from '$lib/components/form/utils';
	import { FormRuleTrigger } from '$lib/types';
	import { judgeValidNumLikeStr } from '$lib/utils/judgements';

	const dispatch = createEventDispatcher();

	export let placeholder = '';
	export let disabled = false;
	export let readonly = false;
	export let loading = false;
	export let maximum = Infinity;
	export let minimum = -Infinity;
	export let precise = 0; // 0 means Int.
	export let stepGap = 1;
	export let showStepOperations = true;

	// Consider that the component is a pure component. Will not straightly manipulate the props.
	export let value = '';
	export let name = `input-number-${calcRandomCompNameSuffix()}`;

	let innerValue = value;
	$: isValidNumLikeStr = judgeValidNumLikeStr(innerValue);

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
			'input--invalid-num': !isValidNumLikeStr
		},
		$$restProps.class
	]);

	function parseValue(val: string): number {
		return parseFloat(val);
	}

	function input(val: string) {
		if (innerDisabled || innerReadonly) {
			return;
		}

		innerValue = val;
		if (!judgeValidNumLikeStr(innerValue)) {
			return;
		}

		if (formItemFieldMisc) {
			formItemFieldMisc.events.handleFieldSetValue(innerValue, FormRuleTrigger.Input);
		}

		// A pure component shouldn't manipulate the prop straightly.
		// value = curValue;

		dispatch('input', value);
	}

	function change(val: string) {
		if (innerDisabled || innerReadonly) {
			return;
		}

		innerValue = val;
		if (!judgeValidNumLikeStr(innerValue)) {
			return;
		}

		let finalValue: string | undefined = undefined;
		if (innerValue !== '') {
			let curValue = parseValue(innerValue);

			if (curValue > maximum) {
				curValue = maximum;
			}

			if (curValue < minimum) {
				curValue = minimum;
			}

			if (precise > 0) {
				finalValue = curValue.toFixed(precise);
			} else {
				finalValue = curValue + '';
			}
		}

		finalValue = finalValue == null ? innerValue : finalValue;
		if (formItemFieldMisc) {
			formItemFieldMisc.events.handleFieldSetValue(finalValue, FormRuleTrigger.Input);
		}

		// A pure component shouldn't manipulate the prop straightly.
		// value = curValue;

		dispatch('change', finalValue);
	}

	function handleInput(e: Event) {
		return input((e.target as HTMLInputElement).value);
	}

	function handleChange(e: Event) {
		return change((e.target as HTMLInputElement).value);
	}

	function handleFocus(e: Event) {
		if (innerDisabled || innerReadonly) {
			return;
		}

		if (formItemFieldMisc) {
			formItemFieldMisc.events.handleFieldFocus(e);
		}

		dispatch('focus', e);
	}

	function handleBlur(e: Event) {
		if (innerDisabled || innerReadonly) {
			return;
		}

		if (!isValidNumLikeStr) {
			innerValue = value;
			if (formItemFieldMisc) {
				formItemFieldMisc.events.handleFieldSetValue(innerValue + '', FormRuleTrigger.Change);
			}
		}

		if (formItemFieldMisc) {
			formItemFieldMisc.events.handleFieldBlur(e);
		}

		dispatch('blur', e);
	}

	function handleExecStepGapMinus() {
		if (!judgeValidNumLikeStr(value)) {
			return;
		}

		return change(!value ? (0 > minimum ? 0 : minimum) + '' : parseValue(value) - 1 + '');
	}

	function handleExecStepGapPlus() {
		if (!judgeValidNumLikeStr(value)) {
			return;
		}

		let innerValue = value;
		if (!innerValue) {
			innerValue = (0 > minimum ? 0 : minimum) + '';
		}

		return change(!value ? (0 > minimum ? 0 : minimum) + '' : parseValue(value) + 1 + '');
	}
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
				{value}
				name={innerName}
				id={name}
				on:input={handleInput}
				on:focus={handleFocus}
				on:blur={handleBlur}
				on:change={handleChange}
			/>
		</div>
		<div class="input__suffix">
			<div class="input__operation-group">
				<span
					class="input__operation input__operation-step-minus fa fa-minus"
					role="button"
					on:click={handleExecStepGapMinus}
				/>
				<span
					class="input__operation input__operation-step-minus fa fa-plus"
					role="button"
					on:click={handleExecStepGapPlus}
				/>
			</div>
			<slot name="suffix" />
		</div>
	</div>
</div>
