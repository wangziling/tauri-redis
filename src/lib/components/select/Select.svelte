<script lang="ts">
	import { calcDynamicClasses, calcRandomCompNameSuffix } from '$lib/utils/calculators';
	import type { SelectOptionItem, SelectOptions } from '$lib/types';
	import { createEventDispatcher, tick } from 'svelte';
	import Input from '$lib/components/Input.svelte';
	import { clickOutside } from '$lib/actions/click-outside';
	import { writable } from 'svelte/store';
	import { initialFormItemFieldMisc } from '$lib/components/form/utils';
	import { FormRuleTrigger } from '$lib/types';
	import Options from '$lib/components/select/Options.svelte';

	const initialValue = Symbol('initialValue');
	const dispatch = createEventDispatcher();
	const defaultName = `select-${calcRandomCompNameSuffix()}`;

	export let disabled = false;
	export let readonly = disabled;
	export let loading = false;
	export let name = defaultName;
	export let searchPlaceholder = 'Search...';
	export let searchable = false;
	export let defaultOptionsVisible = false;
	export let hideInvalidOptions = false;
	export let options: SelectOptions = [];
	// Is a pure component, will not change the prop-value straightly
	export let pure = true;
	// Consider that the component is a pure component. Will not straightly manipulate the props.
	export let value: any = initialValue;
	export let emptyNotice = 'Empty.';
	export let unmatchedNotice = 'Unmatched.';
	export let size: 'default' | 'mini' | 'small' = 'default';
	export let appendToBody = true;

	let optionsVisible = defaultOptionsVisible;
	let searchContent = '';
	let inputIns: null | Input = null;

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
	const valueWatched = writable(value as any | symbol);
	$: valueWatched.set(value);

	const formItemFieldMisc = initialFormItemFieldMisc<typeof value>(
		{ disabledWatched, readonlyWatched, loadingWatched, nameWatched, defaultName, pureWatched, valueWatched },
		{ fieldType: 'select' }
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
		'select',
		{
			'select--disabled': $finalDisabledDerived,
			'select--readonly': $finalReadonlyDerived,
			'select--loading': $finalLoadingDerived,
			'select--options-visible': optionsVisible,
			'select--searchable': searchable,
			'select--valued': $finalValueDerived !== initialValue,
			['select--size-' + size]: size
		},
		$$restProps.class,
		miscClasses
	]);

	$: grepedOptions = searchContent
		? options.filter((o) => o.label && o.label.toLowerCase().includes(searchContent.toLowerCase()))
		: options;

	$: matchedOption = options.find((op) => op.value === $finalValueDerived);
	$: displayValue = $finalValueDerived === initialValue ? '' : $finalValueDerived || '';

	function judgeOptionInvalid(option: SelectOptionItem) {
		return options && typeof option.label === 'string' && option.label && option.value;
	}

	function handleChooseOptionItem(e: CustomEvent<{ option: SelectOptionItem }>) {
		const { option } = e.detail;

		if ($finalDisabledDerived || $finalReadonlyDerived) {
			return;
		}

		valueWatched.set(option.value);
		if ($isFormItemFieldMiscValid) {
			if (!$isNameOrFormFieldPropPresetDerived) {
				// If form context found, but field didn't set the 'prop' value.
				// Means: <FormItem prop=""> or <FormItem></FormItem>.
				// Revert the changes.
				valueWatched.set(option.value);

				return;
			}

			formItemFieldMisc.events.handleFieldSetValue($valueWatched, FormRuleTrigger.Input);
		}

		// A pure component shouldn't manipulate the prop straightly.
		if (!$isPuredDerived) {
			value = $valueWatched;
		}

		dispatch('input', $finalValueDerived);

		hideOptions();
	}

	function calcSelectOptionClass(option: SelectOptionItem, selected: SelectOptionItem['value'] | any) {
		return calcDynamicClasses([
			'select-option',
			{
				'select-option--selected': option.value === selected
			}
		]);
	}

	function handleClickSearchInput(e: CustomEvent<Event>) {
		e.detail.stopPropagation();
		e.detail.preventDefault();
	}

	function handleFocusSearchInput(e: CustomEvent<Event>) {
		if ($finalDisabledDerived || $finalReadonlyDerived) {
			return;
		}

		if ($isFormItemFieldMiscValid) {
			formItemFieldMisc.events.handleFieldFocus(e);
		}

		dispatch('focus', e);
	}

	function handleBlurSearchInput(e: CustomEvent<Event>) {
		if ($finalDisabledDerived || $finalReadonlyDerived) {
			return;
		}

		if ($isFormItemFieldMiscValid) {
			formItemFieldMisc.events.handleFieldBlur(e);
		}

		dispatch('blur', e);
	}

	function handleClickContainer() {
		return toggleOptionsVisible();
	}

	function handleClickOutSide() {
		hideOptions();
	}

	export const focus = function focus() {
		optionsVisible = true;
		if (optionsVisible && searchable) {
			tick().then(() => {
				inputIns && inputIns.focus();
			});
		}
	};

	export const blur = function blur() {
		optionsVisible = false;
	};

	export function toggleOptionsVisible() {
		optionsVisible = !optionsVisible;

		if (optionsVisible && searchable) {
			tick().then(() => {
				inputIns && inputIns.focus();
			});
		}
	}

	export function showOptions() {
		optionsVisible = true;

		if (searchable) {
			tick().then(() => {
				inputIns && inputIns.focus();
			});
		}
	}

	export function hideOptions() {
		optionsVisible = false;
		searchContent = '';
	}
</script>

<div class={dynamicClasses} use:clickOutside on:outside={handleClickOutSide}>
	<div class="select-wrapper">
		<div class="select-container" on:click={handleClickContainer}>
			<div class="select-selector">
				{#if matchedOption}
					{#if matchedOption.labelUsingHtml}
						<div class="select-value">{@html matchedOption.label}</div>
					{:else}
						<div class="select-value">{matchedOption.label}</div>
					{/if}
				{:else}
					<div class="select-value">{displayValue}</div>
				{/if}
				{#if searchable}
					<Input
						class="select-search-input"
						name={$finalNameDerived}
						id={$finalNameDerived}
						disabled={$finalDisabledDerived}
						readonly={$finalReadonlyDerived}
						placeholder={searchPlaceholder}
						bind:this={inputIns}
						on:click={handleClickSearchInput}
						on:focus={handleFocusSearchInput}
						on:blur={handleBlurSearchInput}
						bind:value={searchContent}
						pure={false}
					/>
				{/if}
			</div>
			<div class="select-operations">
				<span class="select-operation select-operation__arrow fa fa-angle-down" />
			</div>
		</div>
		{#if optionsVisible}
			<Options
				options={grepedOptions}
				{hideInvalidOptions}
				selectedValue={$finalValueDerived}
				unmatchedNotice={searchContent ? unmatchedNotice : emptyNotice}
				{appendToBody}
				on:chooseOptionItem={handleChooseOptionItem}
			/>
		{/if}
	</div>
</div>
