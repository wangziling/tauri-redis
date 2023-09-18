import type { FormField, FormFieldPicker } from '$lib/types';
import { createEventDispatcher, getContext, hasContext, onDestroy, onMount } from 'svelte';
import { contextItemStoreKey, contextStoreKey, createItemStore, createStore } from '$lib/components/form/context';
import { derived, get } from 'svelte/store';
import { get as lodashGet, some } from 'lodash-es';

export function initialFormItemMisc(
	condition: Required<FormFieldPicker>,
	options?: Partial<{ useRestrictSetFieldValueMode: boolean }>
) {
	if (!hasContext(contextStoreKey)) {
		return;
	}

	const dispatcher = createEventDispatcher();

	const contextStore = getContext(contextStoreKey) as ReturnType<typeof createStore>;
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

	const unSubscribers: Function[] = [];
	unSubscribers.push(
		fieldValueDerived.subscribe(function setFieldValue(value) {
			if (lodashGet(options, 'useRestrictSetFieldValueMode')) {
				if (
					get(fieldDisabledDerived) ||
					get(fieldReadonlyDerived) ||
					get(fieldLoadingDerived) ||
					get(fieldValidatingDerived)
				) {
					return;
				}
			}

			dispatcher('setFieldValue', { ...condition, value });
		})
	);

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
			disabledDerived: fieldDisabledDerived,
			readonlyDerived: fieldReadonlyDerived,
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
		}
	};
}

export function initialFormItemFieldMisc(type: string) {
	if (!hasContext(contextItemStoreKey)) {
		return;
	}

	const contextItemStore = getContext(contextItemStoreKey) as ReturnType<typeof createItemStore>;
	if (contextItemStore) {
		return;
	}

	const name = contextItemStore.getters.name;

	const handleFieldFocus = function handleFieldFocus() {};

	const handleFieldBlur = function handleFieldBlur() {};

	const handleFieldSetValue = function handleFieldSetValue() {};

	return {
		state: {
			bindings: contextItemStore.getters.bindings
		},
		mutations: {},
		utils: {
			handleFieldFocus,
			handleFieldBlur,
			handleFieldSetValue
		}
	};
}
