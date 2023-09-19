import type { FormField, FormFieldPicker, FormItemValue } from '$lib/types';
import { getContext, hasContext, onDestroy, onMount } from 'svelte';
import { contextItemStoreKey, contextStoreKey, createItemStore, createStore } from '$lib/components/form/context';
import { derived, get, type Readable } from 'svelte/store';
import { some, get as lodashGet } from 'lodash-es';
import type { FormRuleTrigger } from '$lib/types';

export function initialFormItemMisc(
	condition: Required<FormFieldPicker>,
	options?: Partial<{ useRestrictSetFieldValueMode: Readable<boolean> }>
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

	const unSubscribers: Function[] = [];
	const unsubscribe = function unsubscriber() {
		unSubscribers.forEach(function (sub) {
			sub();
		});
	};
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

		unsubscribe();
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
			setFieldRequired
		},
		utils: {
			unsubscribe
		},
		events: {
			handleFieldFocus,
			handleFieldBlur,
			handleFieldSetValue
		}
	};
}

export function initialFormItemFieldMisc(options: { fieldType: string }) {
	if (!hasContext(contextItemStoreKey)) {
		return;
	}

	const contextItemStore = getContext(contextItemStoreKey) as ReturnType<typeof createItemStore>;
	if (!contextItemStore) {
		return;
	}

	return {
		state: {
			name: contextItemStore.getters.name,
			bindings: contextItemStore.getters.bindings
		},
		events: contextItemStore.getters.events
	};
}
