import { derived, get, type Readable, writable } from 'svelte/store';
import type {
	FormField,
	FormFieldPicker,
	FormItemNamedRules,
	FormItemRules,
	FormItemStoreState,
	FormRuleItem,
	FormStoreState,
	PropWritable,
	TArrayMember,
	TArrayOrPrimitive
} from '$lib/types';
import { FormLabelPosition, FormRuleTrigger } from '$lib/types';
import { get as lodashGet, isEmpty, isMatch, set as lodashSet } from 'lodash-es';
import Schema, { type ValidateOption } from 'async-validator';
import type { ValidateCallback } from 'async-validator/dist-types/interface';
import { noop } from '$lib/utils/miscs';
import { generateOperablePromise } from '$lib/utils/async';

type FormFieldDerived = Readable<TArrayMember<FormStoreState['fields']>> | undefined;

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
	iterationCallback?: (field: TArrayMember<FormStoreState['fields']>) => any,
	options?: Pick<FormRuleItem, 'trigger'>
) {
	const usedIterationCallback = typeof iterationCallback === 'function' ? iterationCallback : noop;
	const usedFields = Array.isArray(fields) ? fields : ([] as FormStoreState['fields']).concat(fields);
	const triggers = lodashGet(options, 'trigger');
	const usedTriggers =
		triggers && Array.isArray(triggers) ? triggers : ([] as Array<FormRuleTrigger>).concat(triggers).filter(Boolean);
	const isUsedTriggersValid = !isEmpty(usedTriggers);

	const rules = {} as FormItemNamedRules;
	const recordUsedRules = function (usedRules: FormItemRules, field: FormField) {
		if (isUsedTriggersValid) {
			usedRules = usedRules.filter(function (rule) {
				const ruleTriggers = rule.trigger;
				if (!ruleTriggers) {
					return true;
				}

				if (!Array.isArray(ruleTriggers)) {
					return usedTriggers.includes(ruleTriggers);
				}

				return ruleTriggers.some(function (tr: FormRuleTrigger) {
					return usedTriggers.includes(tr);
				});
			});
		}

		if (Array.isArray(usedRules) && usedRules.length) {
			lodashSet(rules, field.prop, usedRules);
			usedIterationCallback(field);

			return true;
		}

		return false;
	};

	usedFields.forEach(function mapUsedFields(field) {
		if (!field.prop) {
			return;
		}

		const isRecorded = recordUsedRules(field.rules, field);
		if (isRecorded) {
			return;
		}

		recordUsedRules(lodashGet(formRules, field.prop), field);
	});

	return generateRulesValidator(rules);
}

export function generateRulesValidator(rules: FormItemNamedRules) {
	return new Schema(rules);
}

export const createStore = function createStore() {
	const store = {
		name: writable(''),
		fields: writable([]),
		model: writable({}),
		rules: writable({}),
		labelPosition: writable(FormLabelPosition.Top)
	} as PropWritable<FormStoreState>;

	const mutations = {
		setName(payload: FormStoreState['name']) {
			store.name.set(payload);
		},
		setModel(payload: FormStoreState['model']) {
			store.model.set(payload);
		},
		setRules(payload: FormStoreState['rules']) {
			store.rules.set(payload);
		},
		setLabelPosition(payload: FormStoreState['labelPosition']) {
			store.labelPosition.set(payload);
		},
		registerField(payload: TArrayMember<FormStoreState['fields']>) {
			store.fields.update(function registerField(fields) {
				const isExisted = fields.some(function (item) {
					return item.name === payload.name || item.prop === payload.prop;
				});
				if (isExisted) {
					return fields;
				}

				fields.push(payload);

				return fields;
			});
		},
		unregisterField(payload: FormFieldPicker) {
			if (isEmpty(payload)) {
				return;
			}

			store.fields.update(function unregisterField(fields) {
				const idx = fields.findIndex(function (item) {
					return item.name === payload.name || item.prop === payload.prop;
				});
				if (idx === -1) {
					return fields;
				}

				fields.splice(idx, 1);

				return fields;
			});
		},
		setFieldDisabled(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['disabled']
		) {
			store.fields.update(function setFieldDisabled(fields) {
				field.disabled = payload;

				return fields;
			});
		},
		setFieldReadonly(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['readonly']
		) {
			store.fields.update(function setFieldReadonly(fields) {
				field.readonly = payload;

				return fields;
			});
		},
		setFieldLoading(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['loading']
		) {
			store.fields.update(function setFieldLoading(fields) {
				field.loading = payload;

				return fields;
			});
		},
		setFieldValidating(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['validating']
		) {
			store.fields.update(function setFieldValidating(fields) {
				field.validating = payload;

				return fields;
			});
		},
		setFieldRequired(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['required']
		) {
			store.fields.update(function setFieldRequired(fields) {
				field.required = payload;

				return fields;
			});
		},
		setFieldMounted(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['mounted']
		) {
			store.fields.update(function setFieldMounted(fields) {
				field.mounted = payload;

				return fields;
			});
		},
		setFieldRules(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['rules']
		) {
			store.fields.update(function updateRegisteredField(fields) {
				field.rules = payload;

				return fields;
			});
		}
	};

	const actions = {};

	const getters = {};

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

			store.fields.update(function updateRegisteredField(fields) {
				callback(item);
				return fields;
			});
		},
		findRegisteredField(condition: FormFieldPicker) {
			return findRegisteredField(get(store.fields), condition);
		},
		filterRegisteredFields(conditions: TArrayOrPrimitive<FormFieldPicker>) {
			return filterRegisteredFields(get(store.fields), conditions);
		},
		getRegisteredFieldDerived(
			condition: FormFieldPicker
		): ReturnType<typeof derived<(typeof store)['fields'], TArrayMember<FormStoreState['fields']> | undefined>> {
			return derived(store.fields, function (fields) {
				return findRegisteredField(fields, condition);
			});
		},
		getRegisteredFieldsDerived(
			conditions: TArrayOrPrimitive<FormFieldPicker>
		): ReturnType<typeof derived<(typeof store)['fields'], FormStoreState['fields'] | undefined>> {
			return derived(store.fields, function (fields) {
				return filterRegisteredFields(fields, conditions);
			});
		},
		getFieldFormRulesDerived(condition: FormFieldPicker) {
			return derived(store.rules, function (formRules) {
				if (condition.prop) {
					return lodashGet(formRules, condition.prop);
				}

				const foundField = findRegisteredField(get(store.fields), condition);
				if (!(foundField && foundField.prop)) {
					return;
				}

				return lodashGet(formRules, foundField.prop);
			});
		},
		getFieldPropPathValueDerived<T = any>(
			fieldDerived: FormFieldDerived,
			propPath: TArrayOrPrimitive<string>
		): Readable<T | undefined> {
			return derived(fieldDerived, function (field) {
				return lodashGet(field, propPath);
			});
		},
		getFieldPropPathValue(field: TArrayMember<FormStoreState['fields']>, propPath: TArrayOrPrimitive<string>) {
			return lodashGet(field, propPath);
		},
		validate(callback?: ValidateCallback, options?: ValidateOption) {
			const validator = generateFieldRuleValidator(
				get(store.rules),
				get(store.fields),
				function iterationCallback(field) {
					mutations.setFieldValidating(field, true);
				}
			);

			return validator.validate(get(store.model), options, callback);
		},
		validateFields(
			conditions: TArrayOrPrimitive<FormFieldPicker>,
			callback?: ValidateCallback,
			options?: ValidateOption
		) {
			const validator = generateFieldRuleValidator(
				get(store.rules),
				filterRegisteredFields(get(store.fields), conditions),
				function iterationCallback(field) {
					mutations.setFieldValidating(field, true);
				}
			);

			return validator.validate(get(store.model), options, callback);
		},
		validateFieldsWithTrigger(
			conditions: TArrayOrPrimitive<FormFieldPicker>,
			trigger: FormRuleItem['trigger'],
			callback?: ValidateCallback,
			options?: ValidateOption
		) {
			const validator = generateFieldRuleValidator(
				get(store.rules),
				filterRegisteredFields(get(store.fields), conditions),
				function iterationCallback(field) {
					mutations.setFieldValidating(field, true);
				},
				{ trigger }
			);

			return validator.validate(get(store.model), options, callback);
		},
		getFieldFormModelValue(condition: FormFieldPicker) {
			const model = get(store.model);
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
			return derived(store.model, function (model) {
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

	const events = {
		handleValidateFields(conditions: TArrayOrPrimitive<FormFieldPicker>) {
			const { p, resolve, reject } = generateOperablePromise<undefined>();
			utils.validateFields(
				conditions,
				function (errors, fields) {
					if (!errors) {
						resolve(undefined);

						return;
					}

					reject(errors);
				},
				{ first: true }
			);

			return p;
		},
		handleSetFieldValue(condition: FormFieldPicker, options: Pick<FormRuleItem, 'trigger'>) {
			// Trigger validation.
			return utils.validateFields(condition);
		}
	};

	const target = {
		mutations,
		actions,
		getters,
		utils,
		events
	};

	return new Proxy(target, {
		set() {
			return false;
		}
	} as ProxyHandler<typeof target>);
};

export const contextStoreKey = Symbol('formContext');

export const createItemStore = function createItemStore() {
	const store = {
		name: writable(''),
		bindings: writable({})
	} as PropWritable<FormItemStoreState>;

	const mutations = {
		setName(payload: FormItemStoreState['name']) {
			store.name.set(payload);
		},
		setBindings(payload: FormItemStoreState['bindings']) {
			store.bindings.set(payload);
		}
	};

	const actions = {};

	const getters = {
		bindings: derived(store.bindings, function (bindings) {
			return bindings;
		}),
		name: derived(store.name, function (name) {
			return name;
		})
	};

	const utils = {};

	const target = {
		mutations,
		actions,
		getters,
		utils
	};

	return new Proxy(target, {
		set() {
			return false;
		}
	} as ProxyHandler<typeof target>);
};

export const contextItemStoreKey = Symbol('formItemContext');
