<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix } from '$lib/utils/calculators';
	import { createEventDispatcher } from 'svelte';
	import { initialFormItemFieldMisc } from '$lib/components/form/utils';
	import { FormRuleTrigger } from '$lib/types';

	const dispatch = createEventDispatcher();
	const calcDisplayValue = function calcDisplayValue(value: string) {
		return value;
	};

	export let placeholder = '';
	export let disabled = false;
	export let readonly = false;
	export let loading = false;

	// For textarea.
	export let resizable = true;

	// Consider that the component is a pure component. Will not straightly manipulate the props.
	export let value = '';
	export let type: 'text' | 'textarea' | 'password' = 'text';
	export let name = `input-${calcRandomCompNameSuffix()}`;

	let innerType = type;
	$: innerType = type;

	let innerValue = value;
	$: innerValue = value;

	let displayValue = (innerValue = value);
	$: displayValue = calcDisplayValue(innerValue);

	let isPwdVisible = false;
	let inputEl: undefined | HTMLInputElement;

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
			'input--loading': innerLoading,
			['input--type-' + type]: type,
			'input--resizable': resizable
		},
		$$restProps.class
	]);

	function handleInput(e: Event) {
		if (innerDisabled || innerReadonly) {
			if (inputEl) {
				inputEl.value = innerValue;
			}

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
			if (inputEl) {
				inputEl.value = innerValue;
			}

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
		if (innerDisabled || innerReadonly) {
			if (inputEl) {
				inputEl.value = innerValue = value;
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
				inputEl.value = innerValue = value;
			}

			return;
		}

		if (formItemFieldMisc) {
			formItemFieldMisc.events.handleFieldBlur(e);
		}

		dispatch('blur', e);
	}

	function handleTogglePwdVisible() {
		innerType = isPwdVisible ? 'password' : 'text';
		isPwdVisible = !isPwdVisible;
	}
</script>

<div class={dynamicClasses}>
	<div class="input-wrapper">
		{#if innerType === 'textarea'}
			<div class="input__textarea">
				<textarea
					class="input__textarea-el"
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
		{:else}
			<div class="input__prefix">
				<slot name="prefix" />
			</div>
			<div class="input__input">
				<input
					type={innerType}
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
				{#if type === 'password'}
					<span
						class="input__operation input__operation-pwd-visible fa {isPwdVisible ? 'fa-eye-slash' : 'fa-eye'}"
						role="button"
						on:click={handleTogglePwdVisible}
					/>
				{/if}
				<slot name="suffix" />
			</div>
		{/if}
	</div>
</div>
