import { derived, get, type readable, writable } from 'svelte/store';
import type { FormFieldPicker, FormItemNamedRules, FormStoreState, TArrayMember, TArrayOrPrimitive } from '$lib/types';
import { FormLabelPosition } from '$lib/types';
import { assign, get as lodashGet, isEmpty, isMatch, set as lodashSet } from 'lodash-es';
import Schema, { type ValidateOption } from 'async-validator';
import type { ValidateCallback } from 'async-validator/dist-types/interface';
import { noop } from '$lib/utils/miscs';

type FormFieldDerived = ReturnType<
	typeof derived<ReturnType<typeof writable<FormStoreState>>, TArrayMember<FormStoreState['fields']> | undefined>
>;

function findRegisteredField(fields: FormStoreState['fields'], condition: FormFieldPicker) {
	if (isEmpty(condition)) {
		return;
	}

	return fields.find(function (item) {
		return isMatch(item, condition);
	});
}

function filterRegisteredFields(fields: FormStoreState['fields'], conditions: TArrayOrPrimitive<FormFieldPicker>) {
	return ([] as Array<FormFieldPicker>)
		.concat(conditions)
		.map(function (cdt) {
			return findRegisteredField(fields, cdt);
		})
		.filter(Boolean);
}

function generateFieldRuleValidator(
	formRules: FormStoreState['rules'],
	fields: TArrayOrPrimitive<FormStoreState['fields']>,
	iterationCallback?: (field: TArrayMember<FormStoreState['fields']>) => any
) {
	const usedFields = Array.isArray(fields) ? fields : ([] as FormStoreState['fields']).concat(fields);
	const usedIterationCallback = typeof iterationCallback === 'function' ? iterationCallback : noop;

	const rules = {} as FormItemNamedRules;
	usedFields.forEach(function mapUsedFields(field) {
		if (!field.prop) {
			return;
		}

		const usedFieldRules = field.rules;
		if (Array.isArray(usedFieldRules) && usedFieldRules.length) {
			lodashSet(rules, field.prop, usedFieldRules);
			usedIterationCallback(field);
			return;
		}

		const useFormRules = lodashGet(formRules, field.prop);
		if (Array.isArray(useFormRules) && useFormRules.length) {
			lodashSet(rules, field.prop, useFormRules);
			usedIterationCallback(field);
		}
	});

	return generateRulesValidator(rules);
}

export function generateRulesValidator(rules: FormItemNamedRules) {
	return new Schema(rules);
}

export const createStore = function createStore(initialState?: FormStoreState) {
	const store = writable(
		assign(
			{
				name: '',
				fields: [],
				model: {},
				rules: {},
				labelPosition: FormLabelPosition.Top
			} as Partial<FormStoreState>,
			initialState
		)
	);

	const mutations = {
		setName(payload: FormStoreState['name']) {
			store.update(function setName(state) {
				state.name = payload;

				return state;
			});
		},
		setModel(payload: FormStoreState['model']) {
			store.update(function setModel(state) {
				state.model = payload;

				return state;
			});
		},
		setRules(payload: FormStoreState['rules']) {
			store.update(function setRules(state) {
				state.rules = payload;

				return state;
			});
		},
		setLabelPosition(payload: FormStoreState['labelPosition']) {
			store.update(function setRules(state) {
				state.labelPosition = payload;

				return state;
			});
		},
		registerField(payload: TArrayMember<FormStoreState['fields']>) {
			store.update(function registerField(state) {
				const isExisted = state.fields.some(function (item) {
					return item.name === payload.name || item.prop === payload.prop;
				});
				if (isExisted) {
					return state;
				}

				state.fields.push(payload);

				return state;
			});
		},
		unregisterField(payload: FormFieldPicker) {
			if (isEmpty(payload)) {
				return;
			}

			store.update(function unregisterField(state) {
				const idx = state.fields.findIndex(function (item) {
					return item.name === payload.name || item.prop === payload.prop;
				});
				if (idx === -1) {
					return state;
				}

				state.fields.splice(idx, 1);

				return state;
			});
		},
		setFieldDisabled(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['disabled']
		) {
			store.update(function setFieldDisabled(state) {
				field.disabled = payload;

				return state;
			});
		},
		setFieldReadonly(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['readonly']
		) {
			store.update(function setFieldReadonly(state) {
				field.readonly = payload;

				return state;
			});
		},
		setFieldLoading(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['loading']
		) {
			store.update(function setFieldLoading(state) {
				field.loading = payload;

				return state;
			});
		},
		setFieldValidating(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['validating']
		) {
			store.update(function setFieldValidating(state) {
				field.validating = payload;

				return state;
			});
		},
		setFieldRequired(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['required']
		) {
			store.update(function setFieldRequired(state) {
				field.required = payload;

				return state;
			});
		},
		setFieldMounted(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['mounted']
		) {
			store.update(function setFieldMounted(state) {
				field.mounted = payload;

				return state;
			});
		},
		setFieldRules(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['rules']
		) {
			store.update(function updateRegisteredField(state) {
				field.rules = payload;

				return state;
			});
		}
	};

	const actions = {};

	const getters = {
		fields: derived(store, function (state) {
			return state.fields;
		}),
		model: derived(store, function (state) {
			return state.model;
		}),
		rules: derived(store, function (state) {
			return state.rules;
		})
	};

	const utils = {
		updateRegisteredField(
			condition: FormFieldPicker,
			callback: (item: TArrayMember<FormStoreState['fields']> | undefined) => any
		) {
			const item = utils.findRegisteredField(condition);
			if (!item) {
				callback(undefined);
				return;
			}

			store.update(function updateRegisteredField(state) {
				callback(item);
				return state;
			});
		},
		findRegisteredField(condition: FormFieldPicker) {
			return findRegisteredField(get(getters.fields), condition);
		},
		filterRegisteredFields(conditions: TArrayOrPrimitive<FormFieldPicker>) {
			return filterRegisteredFields(get(getters.fields), conditions);
		},
		getRegisteredFieldDerived(
			condition: FormFieldPicker
		): ReturnType<typeof derived<typeof store, TArrayMember<FormStoreState['fields']> | undefined>> {
			return derived(getters.fields, function (fields) {
				return findRegisteredField(fields, condition);
			});
		},
		getRegisteredFieldsDerived(
			conditions: TArrayOrPrimitive<FormFieldPicker>
		): ReturnType<typeof derived<typeof store, FormStoreState['fields'] | undefined>> {
			return derived(getters.fields, function (fields) {
				return filterRegisteredFields(fields, conditions);
			});
		},
		getFieldFormRulesDerived(condition: FormFieldPicker) {
			return derived(getters.rules, function (formRules) {
				if (condition.prop) {
					return lodashGet(formRules, condition.prop);
				}

				const foundField = findRegisteredField(get(getters.fields), condition);
				if (!(foundField && foundField.prop)) {
					return;
				}

				return lodashGet(formRules, foundField.prop);
			});
		},
		getFieldPropPathValueDerived<T = any>(
			fieldDerived: FormFieldDerived,
			propPath: TArrayOrPrimitive<string>
		): ReturnType<typeof readable<T | undefined>> {
			return derived(fieldDerived, function (field) {
				return lodashGet(field, propPath);
			});
		},
		getFieldPropPathValue(field: TArrayMember<FormStoreState['fields']>, propPath: TArrayOrPrimitive<string>) {
			return lodashGet(field, propPath);
		},
		validate(callback?: ValidateCallback, options?: ValidateOption) {
			const state = get(store);

			const validator = generateFieldRuleValidator(state.rules, state.fields, function iterationCallback(field) {
				mutations.setFieldValidating(field, true);
			});

			return validator.validate(state.model, options, callback);
		},
		validateFields(
			conditions: TArrayOrPrimitive<FormFieldPicker>,
			callback?: ValidateCallback,
			options?: ValidateOption
		) {
			const validator = generateFieldRuleValidator(
				get(getters.rules),
				filterRegisteredFields(get(getters.fields), conditions),
				function iterationCallback(field) {
					mutations.setFieldValidating(field, true);
				}
			);

			return validator.validate(get(getters.model), options, callback);
		},
		getFieldFormModelValue(condition: FormFieldPicker) {
			const model = get(getters.model);
			if (condition.prop) {
				return lodashGet(model, condition.prop);
			}

			const registeredField = utils.findRegisteredField(condition);
			if (!registeredField) {
				return;
			}

			return lodashGet(model, registeredField.prop);
		},
		getFieldFormModelValueDerived(condition: FormFieldPicker) {
			return derived(getters.model, function (model) {
				if (condition.prop) {
					return lodashGet(model, condition.prop);
				}

				const registeredField = utils.findRegisteredField(condition);
				if (!registeredField) {
					return;
				}

				return lodashGet(model, registeredField.prop);
			});
		}
	};

	const target = {
		mutations,
		actions,
		getters,
		utils,
		subscribe: store.subscribe
	};

	return new Proxy(target, {
		set() {
			return false;
		}
	} as ProxyHandler<typeof target>);
};

export const contextStoreKey = Symbol('formContext');
