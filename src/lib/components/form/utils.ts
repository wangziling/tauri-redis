import type { FormField, FormFieldPicker } from '$lib/types';
import { createEventDispatcher, getContext, hasContext, onDestroy, onMount } from 'svelte';
import { contextStoreKey, createStore } from '$lib/components/form/context';
import { get } from 'svelte/store';
import { get as lodashGet } from 'lodash-es';
import { FormItemMessageType } from '$lib/types';

export function initialFormItemMisc(
	condition: Required<FormFieldPicker>,
	otherMetrics: Pick<FormField, 'rules' | 'required'>,
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
	const updateFieldOtherMetrics = function updateFieldOtherMetrics(newOtherMetrics: typeof otherMetrics) {
		const field = get(fieldDerived);
		if (!field) {
			return;
		}

		contextStore.mutations.setFieldRequired(field, newOtherMetrics.required);
		contextStore.mutations.setFieldRules(field, newOtherMetrics.rules);
	};

	onDestroy(function onDestroy() {
		contextStore.mutations.unregisterField(condition);

		unsubscribe();
	});

	onMount(function onMount() {
		contextStore.mutations.registerField({
			...condition,
			...otherMetrics,
			messageInfo: undefined,
			loading: false,
			disabled: false,
			readonly: false,
			validating: false
		});

		contextStore.utils.updateRegisteredField(condition, function setMessageInfo(field) {
			if (!field) {
				return;
			}

			field.messageInfo = {
				type: FormItemMessageType.Info,
				message: '123'
			};
		});
	});

	return {
		state: {
			messageInfoDerived: fieldMessageInfoDerived,
			valueDerived: fieldValueDerived,
			disabledDerived: fieldDisabledDerived,
			readonlyDerived: fieldReadonlyDerived,
			loadingDerived: fieldLoadingDerived,
			validatingDerived: fieldValidatingDerived,
			requiredDerived: fieldRequiredDerived
		},
		utils: {
			unsubscribe,
			updateFieldOtherMetrics
		}
	};
}
