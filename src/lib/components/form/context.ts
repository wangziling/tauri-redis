import { derived, get, type readable, writable } from 'svelte/store';
import type { FormItemNamedRules, FormStoreState, TArrayMember, TArrayOrPrimitive } from '$lib/types';
import { isEmpty, isMatch, assign, get as lodashGet } from 'lodash-es';
import Schema, { type ValidateOption } from 'async-validator';
import type { ValidateCallback } from 'async-validator/dist-types/interface';

type FormFieldPicker = Partial<Pick<TArrayMember<FormStoreState['fields']>, 'name' | 'prop'>>;

export function findRegisteredField(state: FormStoreState, condition: FormFieldPicker) {
	if (isEmpty(condition)) {
		return;
	}

	return state.fields.find(function (item) {
		return isMatch(item, condition);
	});
}

export function filterRegisteredFields(state: FormStoreState, conditions: TArrayOrPrimitive<FormFieldPicker>) {
	return ([] as Array<FormFieldPicker>)
		.concat(conditions)
		.map(function (cdt) {
			return findRegisteredField(state, cdt);
		})
		.filter(Boolean);
}

export function getFieldPropPathValue(
	state: FormStoreState,
	condition: FormFieldPicker,
	propPath: TArrayOrPrimitive<string>
) {
	return lodashGet(findRegisteredField(state, condition), propPath);
}

export function generateRulesValidator(rules: FormItemNamedRules) {
	return new Schema(rules);
}

export function generateFieldRuleValidator(fields: TArrayOrPrimitive<FormStoreState['fields']>) {
	const usedFields = Array.isArray(fields) ? fields : ([] as FormStoreState['fields']).concat(fields);

	const rules = {} as FormItemNamedRules;
	usedFields.forEach(function mapUsedFields(field) {
		if (!field.prop) {
			return;
		}

		const r = field.rules;
		if (Array.isArray(r) && r.length) {
			rules[field.prop] = r;
		}
	});

	return generateRulesValidator(rules);
}

export const createStore = function createStore(initialState?: FormStoreState) {
	const store = writable(
		assign(
			{
				name: '',
				fields: []
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
		}
	};

	const actions = {};

	const getters = {
		fields: derived(store, function (state) {
			return state.fields;
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
			return findRegisteredField(get(store), condition);
		},
		filterRegisteredFields(conditions: TArrayOrPrimitive<FormFieldPicker>) {
			return filterRegisteredFields(get(store), conditions);
		},
		getFieldPropPathValueDerived<T = any>(
			condition: FormFieldPicker,
			propPath: TArrayOrPrimitive<string>
		): ReturnType<typeof readable<T | undefined>> {
			return derived(store, function (state) {
				return lodashGet(findRegisteredField(state, condition), propPath);
			});
		},
		getFieldPropPathValue(condition: FormFieldPicker, propPath: TArrayOrPrimitive<string>) {
			return getFieldPropPathValue(get(store), condition, propPath);
		},
		validate(callback?: ValidateCallback, options?: ValidateOption) {
			const state = get(store);

			return generateFieldRuleValidator(state.fields).validate(state.model, options, callback);
		},
		validateFields(
			conditions: TArrayOrPrimitive<FormFieldPicker>,
			callback?: ValidateCallback,
			options?: ValidateOption
		) {
			const state = get(store);

			return generateFieldRuleValidator(filterRegisteredFields(state, conditions)).validate(
				state.model,
				options,
				callback
			);
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
