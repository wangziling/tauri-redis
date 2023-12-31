<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix } from '$lib/utils/calculators';
	import { createEventDispatcher } from 'svelte';
	import { initialFormItemFieldMisc } from '$lib/components/form/utils';
	import { FormRuleTrigger } from '$lib/types';
	import { writable } from 'svelte/store';
	import Icon from '$lib/components/Icon.svelte';

	const dispatch = createEventDispatcher();
	const calcDisplayValue = function calcDisplayValue(value: string) {
		return value;
	};

	const defaultName = `input-${calcRandomCompNameSuffix()}`;

	export let placeholder = '';
	export let disabled = false;
	export let readonly = false;
	export let loading = false;

	// For textarea.
	export let resizable = true;

	// Is a pure component, will not change the prop-value straightly
	export let pure = true;
	// Consider that the component is a pure component. Will not straightly manipulate the props.
	export let value = '';

	export let type: 'text' | 'textarea' | 'password' = 'text';
	export let name = defaultName;
	export let size: 'default' | 'mini' | 'small' = 'default';

	let innerType = type;
	$: innerType = type;

	let isPwdVisible = false;
	let inputEl: undefined | HTMLInputElement;
	let textareaEl: undefined | HTMLTextAreaElement;

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
		{ fieldType: 'input' }
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

	$: dynamicClasses = calcDynamicClasses([
		'input',
		{
			'input--disabled': $finalDisabledDerived,
			'input--readonly': $finalReadonlyDerived,
			'input--loading': $finalLoadingDerived,
			['input--type-' + type]: type,
			['input--size-' + size]: size,
			'input--resizable': resizable
		},
		$miscClasses,
		$$restProps.class
	]);

	let displayValue = calcDisplayValue($finalValueDerived);
	$: displayValue = calcDisplayValue($finalValueDerived);

	$: currentEl = (type === 'textarea' ? textareaEl : inputEl) as HTMLInputElement | HTMLTextAreaElement;

	function handleInput(e: Event) {
		if ($finalDisabledDerived || $finalReadonlyDerived) {
			if (currentEl) {
				currentEl.value = $finalValueDerived;
			}

			return;
		}

		valueWatched.set((e.target as HTMLInputElement).value);
		if ($isFormItemFieldMiscValid) {
			if (!$isNameOrFormFieldPropPresetDerived) {
				// If form context found, but field didn't set the 'prop' value.
				// Means: <FormItem prop=""> or <FormItem></FormItem>.
				// Revert the changes.
				(e.target as HTMLInputElement).value = value;
				valueWatched.set(value);

				return;
			}

			formItemFieldMisc.events.handleFieldSetValue($valueWatched, FormRuleTrigger.Input);
		}

		// A pure component shouldn't manipulate the prop straightly.
		if (!$isPuredDerived) {
			value = $valueWatched;
		}

		dispatch('input', $finalValueDerived);
	}

	function handleChange(e: Event) {
		if ($finalDisabledDerived || $finalReadonlyDerived) {
			if (currentEl) {
				currentEl.value = $finalValueDerived;
			}

			return;
		}

		valueWatched.set((e.target as HTMLInputElement).value);
		if ($isFormItemFieldMiscValid) {
			if (!$isNameOrFormFieldPropPresetDerived) {
				// If form context found, but field didn't set the 'prop' value.
				// Means: <FormItem prop=""> or <FormItem></FormItem>.
				// Revert the changes.
				(e.target as HTMLInputElement).value = value;
				valueWatched.set(value);

				return;
			}

			formItemFieldMisc.events.handleFieldSetValue($valueWatched, FormRuleTrigger.Change);
		}

		// A pure component shouldn't manipulate the prop straightly.
		if (!$isPuredDerived) {
			value = $valueWatched;
		}

		dispatch('change', $finalValueDerived);
	}

	function handleFocus(e: Event) {
		if (currentEl) {
			currentEl.value = displayValue;
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
		if (currentEl) {
			currentEl.value = displayValue;
		}

		if ($finalDisabledDerived || $finalReadonlyDerived) {
			return;
		}

		if ($isFormItemFieldMiscValid) {
			formItemFieldMisc.events.handleFieldBlur(e);
		}

		dispatch('blur', e);
	}

	function handleClick(e: Event) {
		dispatch('click', e);
	}

	function handleTogglePwdVisible() {
		innerType = isPwdVisible ? 'password' : 'text';
		isPwdVisible = !isPwdVisible;
	}

	export const focus = function focus() {
		if (!currentEl) {
			return;
		}

		currentEl.focus();
	};

	export const blur = function blur() {
		if (!currentEl) {
			return;
		}

		currentEl.blur();
	};
</script>

<div class={dynamicClasses} on:click={handleClick}>
	<div class="input-wrapper">
		{#if innerType === 'textarea'}
			<div class="input__textarea">
				<textarea
					class="input__textarea-el"
					{placeholder}
					disabled={$finalDisabledDerived}
					readonly={$finalReadonlyDerived}
					value={displayValue}
					name={$finalNameDerived}
					id={name}
					bind:this={textareaEl}
					on:input={handleInput}
					on:focus={handleFocus}
					on:blur={handleBlur}
					on:change={handleChange}
					on:keyup
					on:keydown
					on:keypress
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
					on:keyup
					on:keydown
					on:keypress
				/>
			</div>
			<div class="input__suffix">
				{#if type === 'password'}
					<Icon
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
