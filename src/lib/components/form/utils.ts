import type { FormField, FormFieldPicker, FormItemValue } from '$lib/types';
import { getContext, hasContext, onDestroy, onMount } from 'svelte';
import { contextItemStoreKey, contextStoreKey, createItemStore, createStore } from '$lib/components/form/context';
import { derived, get, readable, type Readable, type Writable, writable } from 'svelte/store';
import { some, get as lodashGet } from 'lodash-es';
import type { FormRuleTrigger } from '$lib/types';
import { SubscribeManager } from '$lib/utils/subscriber';

export function initialFormItemMisc(
	condition: Required<FormFieldPicker>,
	options?: Partial<{
		useRestrictSetFieldValueMode: Readable<boolean>;
	}>
) {
	if (!hasContext(contextStoreKey)) {
		return;
	}

	const contextStore = getContext(contextStoreKey) as ReturnType<typeof createStore>;
	const formUseRestrictSetFieldValueMode = contextStore.getters.useRestrictSetFieldValueMode;

	const fieldDerived = contextStore.utils.getRegisteredFieldDerived(condition);

	const fieldValueDerived = contextStore.utils.getFieldFormModelValueDerived(condition);
	const fieldMessageInfoDerived = contextStore.utils.getFieldPropPathValueDerived<FormField['messageInfo']>(
		fieldDerived,
		'messageInfo'
	);
	const fieldDisabledDerived = contextStore.utils.getFieldPropPathValueDerived<FormField['disabled']>(
		fieldDerived,
		'disabled'
	);
	const fieldReadonlyDerived = contextStore.utils.getFieldPropPathValueDerived<FormField['readonly']>(
		fieldDerived,
		'readonly'
	);
	const fieldLoadingDerived = contextStore.utils.getFieldPropPathValueDerived<FormField['loading']>(
		fieldDerived,
		'loading'
	);
	const fieldValidatingDerived = contextStore.utils.getFieldPropPathValueDerived<FormField['validating']>(
		fieldDerived,
		'validating'
	);
	const fieldRequiredDerived = contextStore.utils.getFieldPropPathValueDerived<FormField['required']>(
		fieldDerived,
		'required'
	);
	const fieldPropDerived = contextStore.utils.getFieldPropPathValueDerived<FormField['prop']>(fieldDerived, 'prop');
	const fieldRulesDerived = contextStore.utils.getFieldPropPathValueDerived<FormField['rules']>(fieldDerived, 'rules');
	const fieldFormRulesDerived = contextStore.utils.getFieldFormRulesDerived(condition);

	// If we set required or set 'required' related rules.
	// We need to consider that the field is required.
	const modifiedFieldRequiredDerived = derived(
		[fieldRequiredDerived, fieldFormRulesDerived, fieldRulesDerived],
		function ([fieldRequired, fieldFormRules, fieldRules]) {
			return (
				fieldRequired ||
				some(fieldFormRules, function (rule) {
					return rule.required;
				}) ||
				some(fieldRules, function (rule) {
					return rule.required;
				})
			);
		}
	);
	// FormDisabled || FieldDisabled.
	const modifiedFieldDisabledDerived = derived(
		[fieldDisabledDerived, contextStore.getters.disabled],
		function ([fieldDisabled, formDisabled]) {
			return fieldDisabled || formDisabled;
		}
	);
	// FormReadonly || FieldReadonly.
	const modifiedFieldReadonlyDerived = derived(
		[fieldReadonlyDerived, contextStore.getters.readonly],
		function ([fieldReadonly, formReadonly]) {
			return fieldReadonly || formReadonly;
		}
	);

	const subscribeManager = new SubscribeManager();

	const setFieldRules = function setFieldRules(rules: FormField['rules']) {
		const field = get(fieldDerived);
		if (!field) {
			return;
		}

		contextStore.mutations.setFieldRules(field, rules);
	};

	const setFieldRequired = function setFieldRequired(required: FormField['required']) {
		const field = get(fieldDerived);
		if (!field) {
			return;
		}

		contextStore.mutations.setFieldRequired(field, required);
	};

	const setFieldDisabled = function setFieldDisabled(required: FormField['required']) {
		const field = get(fieldDerived);
		if (!field) {
			return;
		}

		contextStore.mutations.setFieldDisabled(field, required);
	};

	const setFieldReadonly = function setFieldReadonly(required: FormField['required']) {
		const field = get(fieldDerived);
		if (!field) {
			return;
		}

		contextStore.mutations.setFieldReadonly(field, required);
	};

	const setFieldLoading = function setFieldLoading(required: FormField['required']) {
		const field = get(fieldDerived);
		if (!field) {
			return;
		}

		contextStore.mutations.setFieldLoading(field, required);
	};

	const setFieldMounted = function setFieldMounted(mounted: FormField['mounted']) {
		const field = get(fieldDerived);
		if (!field) {
			return;
		}

		contextStore.mutations.setFieldMounted(field, mounted);
	};

	const handleFieldFocus = function handleFieldFocus(e: Event) {
		const field = get(fieldDerived);
		if (!field) {
			return;
		}

		if (get(modifiedFieldDisabledDerived) || get(modifiedFieldReadonlyDerived)) {
			return;
		}

		return contextStore.events.handleFieldFocus({ name: field.name });
	};

	const handleFieldBlur = function handleFieldBlur(e: Event) {
		const field = get(fieldDerived);
		if (!field) {
			return;
		}

		if (get(modifiedFieldDisabledDerived) || get(modifiedFieldReadonlyDerived)) {
			return;
		}

		return contextStore.events.handleFieldBlur({ name: field.name });
	};

	const handleFieldSetValue = function handleFieldSetValue(
		curValue: FormItemValue,
		trigger: FormRuleTrigger.Input | FormRuleTrigger.Change
	) {
		const field = get(fieldDerived);
		if (!field) {
			return;
		}

		// If set. Cannot update field data when 'disabled', 'readonly', 'loading' and 'validating'.
		const isForciblySetFieldValue = [
			formUseRestrictSetFieldValueMode,
			lodashGet(options, 'useRestrictSetFieldValueMode')
		].every(function (enabled) {
			if (!enabled) {
				return true;
			}

			return get(enabled);
		});
		if (isForciblySetFieldValue) {
			if (
				get(modifiedFieldDisabledDerived) ||
				get(modifiedFieldReadonlyDerived) ||
				get(fieldLoadingDerived) ||
				get(fieldValidatingDerived)
			) {
				return;
			}
		}

		return contextStore.events.handleSetFieldValue({ prop: field.prop }, curValue, get(fieldValueDerived), { trigger });
	};

	// Register.
	contextStore.mutations.registerField({
		...condition,
		messageInfo: undefined,
		required: false,
		loading: false,
		disabled: false,
		readonly: false,
		validating: false,
		mounted: false,
		rules: []
	});

	onDestroy(function onDestroy() {
		contextStore.mutations.unregisterField(condition);

		subscribeManager.unsubscribe();
	});

	onMount(function onMount() {
		setFieldMounted(true);

		// contextStore.utils.updateRegisteredField(condition, function setMessageInfo(field) {
		// 	if (!field) {
		// 		return;
		// 	}
		//
		// 	field.messageInfo = {
		// 		type: FormItemMessageType.Info,
		// 		message: '123'
		// 	};
		// });
	});

	return {
		state: {
			propDerived: fieldPropDerived,
			messageInfoDerived: fieldMessageInfoDerived,
			valueDerived: fieldValueDerived,
			disabledDerived: modifiedFieldDisabledDerived,
			readonlyDerived: modifiedFieldReadonlyDerived,
			loadingDerived: fieldLoadingDerived,
			validatingDerived: fieldValidatingDerived,
			requiredDerived: modifiedFieldRequiredDerived,
			fieldFormRulesDerived,
			rulesDerived: fieldRulesDerived,
			fieldDerived
		},
		mutations: {
			setFieldRules,
			setFieldRequired,
			setFieldDisabled,
			setFieldReadonly,
			setFieldLoading
		},
		events: {
			handleFieldFocus,
			handleFieldBlur,
			handleFieldSetValue
		},
		utils: {
			judgeConsumed: contextStore.utils.judgeConsumed,
			setConsumed: contextStore.utils.setConsumed
		}
	};
}

export function initialFormItemFieldMisc<Value = FormItemValue>(
	initialState: {
		disabledWatched: Writable<FormField['disabled']>;
		readonlyWatched: Writable<FormField['readonly']>;
		loadingWatched: Writable<FormField['loading']>;
		nameWatched: Writable<FormField['prop']>;
		valueWatched: Writable<Value>;
		defaultName: string;
		pureWatched: Writable<boolean>;
	},
	options: {
		fieldType: string;
	}
) {
	type ContextItemStore = ReturnType<typeof createItemStore>;

	const valid = writable(false);

	const miscNameWatched: Writable<FormField['prop']> = writable('');
	const miscLoadingWatch: Writable<FormField['loading']> = writable(false);
	const miscReadonlyWatched: Writable<FormField['readonly']> = writable(false);
	const miscDisabledWatched: Writable<FormField['disabled']> = writable(false);
	const miscValueWatched: Writable<Value> = writable(undefined);

	const finalNameDerived: Readable<FormField['prop']> = derived(
		[miscNameWatched, initialState.nameWatched],
		function ([miscName, name]) {
			return miscName || name;
		}
	);
	const finalLoadingDerived: Readable<FormField['loading']> = derived(
		[miscLoadingWatch, initialState.loadingWatched],
		function ([miscLoading, loading]) {
			return miscLoading || loading;
		}
	);
	const finalReadonlyDerived: Readable<FormField['readonly']> = derived(
		[miscReadonlyWatched, initialState.readonlyWatched],
		function ([miscReadonly, readonly]) {
			return miscReadonly || readonly;
		}
	);
	const finalDisabledDerived: Readable<FormField['disabled']> = derived(
		[miscDisabledWatched, initialState.disabledWatched],
		function ([miscDisabled, disabled]) {
			return miscDisabled || disabled;
		}
	);
	const finalValueDerived: Readable<Value> = derived(
		[miscValueWatched, initialState.valueWatched],
		function ([miscValue, value]) {
			return miscValue || value;
		}
	);

	// Did this final name is the same as the default name.
	// If true, okay, means the component didn't get the name from the upper component or form field.
	const isNameOrFormFieldPropPresetDerived: Readable<boolean> = derived(finalNameDerived, function (finalName) {
		return finalName !== initialState.defaultName;
	});

	// If we set the form field name, means the field is under the form context.
	// Ok, we need to make the field as a pure component.
	// The prop-value from upper stream cannot be straightly modified,
	// must to and will only be modified through the unified form event handler.
	const isPuredDerived: Readable<boolean> = derived(
		[miscNameWatched, initialState.pureWatched],
		function ([miscName, pured]) {
			if (miscName && miscName !== initialState.defaultName) {
				return true;
			}

			return pured;
		}
	);

	// If under form context but without set the 'prop'.
	// Set an uniq class name.
	const miscClasses: Readable<string> = derived(
		[isNameOrFormFieldPropPresetDerived, valid],
		function ([isNameOrFormFieldPropPreset, valid]) {
			return valid && !isNameOrFormFieldPropPreset ? 'form-item-field--without-prop' : '';
		}
	);

	const result = {
		state: {
			name: '',
			bindings: {} as ContextItemStore['getters']['bindings']
		},
		getters: {
			miscNameWatched,
			miscLoadingWatch,
			miscReadonlyWatched,
			miscDisabledWatched,
			miscClasses,
			finalNameDerived,
			finalLoadingDerived,
			finalReadonlyDerived,
			finalDisabledDerived,
			finalValueDerived,
			isNameOrFormFieldPropPresetDerived,
			isPuredDerived
		},
		metrics: {
			valid
		},
		events: {} as ContextItemStore['getters']['events']
	};

	if (!hasContext(contextItemStoreKey)) {
		return result;
	}

	const contextItemStore = getContext(contextItemStoreKey) as ContextItemStore;
	if (!contextItemStore) {
		return result;
	}

	if (contextItemStore.utils.judgeConsumed()) {
		return result;
	}

	contextItemStore.utils.setConsumed();
	valid.set(true);

	const bindings = contextItemStore.getters.bindings;
	result.state.name = contextItemStore.getters.name;
	result.state.bindings = bindings;
	result.events = contextItemStore.getters.events;

	const subscribeManager = new SubscribeManager();

	subscribeManager.subscribe(
		bindings.prop.subscribe(function (prop) {
			miscNameWatched.set(prop);
		})
	);

	subscribeManager.subscribe(
		bindings.loading.subscribe(function (loading) {
			miscLoadingWatch.set(loading);
		})
	);

	subscribeManager.subscribe(
		bindings.disabled.subscribe(function (disabled) {
			miscDisabledWatched.set(disabled);
		})
	);

	subscribeManager.subscribe(
		bindings.value.subscribe(function (value) {
			miscValueWatched.set(value as Value);
		})
	);

	subscribeManager.subscribe(
		bindings.readonly.subscribe(function (readonly) {
			miscReadonlyWatched.set(readonly);
		})
	);

	subscribeManager.subscribe(
		initialState.disabledWatched.subscribe(function (disabled) {
			contextItemStore.getters.mutations.setFieldDisabled(disabled);
		})
	);

	subscribeManager.subscribe(
		initialState.readonlyWatched.subscribe(function (readonly) {
			contextItemStore.getters.mutations.setFieldReadonly(readonly);
		})
	);

	subscribeManager.subscribe(
		initialState.loadingWatched.subscribe(function (loading) {
			contextItemStore.getters.mutations.setFieldLoading(loading);
		})
	);

	onDestroy(function onDestroy() {
		subscribeManager.unsubscribe();
	});

	return result;
}
