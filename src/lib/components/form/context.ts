import { derived, get, type Readable, writable } from 'svelte/store';
import type {
	FormField,
	FormFieldPicker,
	FormItemNamedRules,
	FormItemRules,
	FormItemStoreState,
	FormItemValue,
	FormRuleItem,
	FormStoreOptions,
	FormStoreState,
	FormValidatePromiseError,
	PropWritable,
	Raw,
	TArrayMember,
	TArrayOrPrimitive
} from '$lib/types';
import { FormItemMessageReasonType, FormItemMessageType, FormLabelPosition, FormRuleTrigger } from '$lib/types';
import { get as lodashGet, isEmpty, isMatch, merge, set as lodashSet } from 'lodash-es';
import Schema, { type ValidateOption } from 'async-validator';
import type { ValidateCallback } from 'async-validator/dist-types/interface';
import { noop } from '$lib/utils/miscs';

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

function generateFieldRuleValidatorUtils(
	formRules: Raw<FormStoreState['rules']>,
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
	const needToValidateFields = [] as FormStoreState['fields'];
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

		let isRecorded = recordUsedRules(field.rules, field);
		if (isRecorded) {
			needToValidateFields.push(field);

			return;
		}

		isRecorded = recordUsedRules(lodashGet(formRules, field.prop), field);
		if (isRecorded) {
			needToValidateFields.push(field);

			return;
		}
	});

	return {
		validator: generateRulesValidator(rules),
		rules,
		fields: needToValidateFields
	};
}

export function generateRulesValidator(rules: FormItemNamedRules) {
	return new Schema(rules);
}

export const createStore = function createStore(options: FormStoreOptions) {
	const store = {
		name: writable(''),
		fields: writable([]),
		model: writable({}),
		rules: writable({}),
		labelPosition: writable(FormLabelPosition.Top),
		useRestrictSetFieldValueMode: writable(false),
		disabled: writable(false),
		readonly: writable(false)
	} as PropWritable<FormStoreState>;

	const mutations = {
		setName(payload: FormStoreState['name']) {
			store.name.set(payload);
		},
		setModel(payload: FormStoreState['model']) {
			store.model = payload;
		},
		setRules(payload: FormStoreState['rules']) {
			store.rules = payload;
		},
		setLabelPosition(payload: FormStoreState['labelPosition']) {
			store.labelPosition.set(payload);
		},
		setUseRestrictSetFieldValueMode(payload: FormStoreState['useRestrictSetFieldValueMode']) {
			store.useRestrictSetFieldValueMode.set(payload);
		},
		setDisabled(payload: FormStoreState['disabled']) {
			store.disabled.set(payload);
		},
		setReadonly(payload: FormStoreState['readonly']) {
			store.readonly.set(payload);
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
		},
		setFieldMessageInfo(
			field: TArrayMember<FormStoreState['fields']>,
			payload: TArrayMember<FormStoreState['fields']>['messageInfo']
		) {
			store.fields.update(function updateRegisteredField(fields) {
				field.messageInfo = payload;

				return fields;
			});
		},
		setFieldValue(fieldProp: TArrayMember<FormStoreState['fields']>['prop'], curValue: FormItemValue) {
			store.model.update(function (model) {
				lodashSet(model, fieldProp, curValue);
				return model;
			});
		}
	};

	const metrics = {
		consumed: false
	};

	const actions = {};

	const getters = {
		useRestrictSetFieldValueMode: derived(store.useRestrictSetFieldValueMode, function (useRestrictSetFieldValueMode) {
			return useRestrictSetFieldValueMode;
		}),
		disabled: derived(store.disabled, function (disabled) {
			return disabled;
		}),
		readonly: derived(store.readonly, function (readonly) {
			return readonly;
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
			const validatorUtils = generateFieldRuleValidatorUtils(
				get(store.rules),
				get(store.fields),
				function iterationCallback(field) {
					mutations.setFieldValidating(field, true);
				}
			);

			return validatorUtils.validator
				.validate(get(store.model), options, callback)
				.then(function (model) {
					validatorUtils.fields.forEach(function (field) {
						mutations.setFieldValidating(field, false);
					});

					return {
						model, // It returns the model which we sent in.
						rules: validatorUtils.rules,
						fields: validatorUtils.fields
					};
				})
				.catch(function (e) {
					validatorUtils.fields.forEach(function (field) {
						mutations.setFieldValidating(field, false);
					});
					throw e;
				});
		},
		validateFields(
			conditions: TArrayOrPrimitive<FormFieldPicker>,
			callback?: ValidateCallback,
			options?: ValidateOption,
			ruleOptions?: Partial<{
				trigger: FormRuleItem['trigger'];
			}>
		) {
			const validatorUtils = generateFieldRuleValidatorUtils(
				get(store.rules),
				filterRegisteredFields(get(store.fields), conditions),
				function iterationCallback(field) {
					mutations.setFieldValidating(field, true);
				},
				ruleOptions
			);

			return validatorUtils.validator
				.validate(get(store.model), options, callback)
				.then(function (model) {
					validatorUtils.fields.forEach(function (field) {
						mutations.setFieldValidating(field, false);
					});

					return {
						model, // It returns the model which we sent in.
						rules: validatorUtils.rules,
						fields: validatorUtils.fields
					};
				})
				.catch(function (e) {
					validatorUtils.fields.forEach(function (field) {
						mutations.setFieldValidating(field, false);
					});
					throw e;
				});
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
		},
		setConsumed() {
			metrics.consumed = true;
		},
		judgeConsumed() {
			return metrics.consumed;
		}
	};

	const dispatches = {
		dispatchValidateField(
			fieldProp: FormField['prop'],
			isValid: boolean,
			error: null | Pick<FormField['messageInfo'], 'message' | 'type'>
		) {
			return options.dispatchCallback('validateField', {
				prop: fieldProp,
				isValid,
				error
			});
		},
		dispatchChangeFieldValue(fieldProp: FormField['prop'], curValue: FormItemValue, oldValue: FormItemValue) {
			return options.dispatchCallback('changeFieldValue', {
				prop: fieldProp,
				curValue,
				oldValue
			});
		}
	};

	const events = {
		handleValidate(...args: Parameters<(typeof utils)['validate']>) {
			const [callback, options] = args;

			return utils
				.validate(callback, merge({ first: true } as Partial<ValidateOption>, options))
				.then(function (res) {
					const fields = lodashGet(res, 'fields');
					if (!fields.length) {
						return res;
					}

					// Try to clear.
					fields.forEach(function (field) {
						mutations.setFieldMessageInfo(field, undefined);

						// Propagation.
						dispatches.dispatchValidateField(field.prop, true, null);
					});

					return res;
				})
				.catch(function (e: FormValidatePromiseError) {
					if (!e.errors) {
						return e.fields;
					}

					e.errors.forEach(function (err) {
						const prop = err.field;
						if (!prop) {
							return;
						}

						// Propagation.
						dispatches.dispatchValidateField(prop, false, {
							type: FormItemMessageType.Error,
							message: err.message
						});

						// Record.
						utils.updateRegisteredField({ prop }, function setMessageInfo(field) {
							field.messageInfo = {
								type: FormItemMessageType.Error,
								message: err.message,
								reason: {
									type: FormItemMessageReasonType.FormValidation
								}
							};
						});
					});

					throw e;
				});
		},
		handleValidateFields(...args: Parameters<(typeof utils)['validateFields']>) {
			const [conditions, callback, options, ruleOptions] = args;

			return utils
				.validateFields(conditions, callback, merge({ first: true } as Partial<ValidateOption>, options), ruleOptions)
				.then(function (res) {
					const fields = lodashGet(res, 'fields');
					if (!fields.length) {
						return res;
					}

					// Try to clear.
					fields.forEach(function (field) {
						mutations.setFieldMessageInfo(field, undefined);

						// Propagation.
						dispatches.dispatchValidateField(field.prop, true, null);
					});

					return res;
				})
				.catch(function (e: FormValidatePromiseError) {
					if (!e.errors) {
						return e.fields;
					}

					e.errors.forEach(function (err) {
						const prop = err.field;
						if (!prop) {
							return;
						}

						// Propagation.
						dispatches.dispatchValidateField(prop, false, {
							type: FormItemMessageType.Error,
							message: err.message
						});

						utils.updateRegisteredField({ prop }, function setMessageInfo(field) {
							if (!field) {
								return;
							}

							field.messageInfo = {
								type: FormItemMessageType.Error,
								message: err.message,
								reason: {
									type: FormItemMessageReasonType.FormFieldValidation
								}
							};
						});
					});

					throw e;
				});
		},
		handleSetFieldValue(
			condition: FormFieldPicker & {
				prop: TArrayMember<FormStoreState['fields']>['prop'];
			},
			curValue: FormItemValue,
			oldValue: FormItemValue,
			options?: Pick<FormRuleItem, 'trigger'>
		) {
			// Set value.
			mutations.setFieldValue(condition.prop, curValue);

			// Dispatch.
			dispatches.dispatchChangeFieldValue(condition.prop, curValue, oldValue);

			// Trigger validation.
			return events
				.handleValidateFields(condition, undefined, undefined, { trigger: lodashGet(options, 'trigger') })
				.catch(function (e) {
					return;
				});
		},
		handleFieldBlur(condition: FormFieldPicker) {
			return events
				.handleValidateFields(condition, undefined, undefined, { trigger: FormRuleTrigger.Blur })
				.catch(function (e) {
					return;
				});
		},
		handleFieldFocus(condition: FormFieldPicker) {
			return events
				.handleValidateFields(condition, undefined, undefined, { trigger: FormRuleTrigger.Focus })
				.catch(function (e) {
					return;
				});
		},
		handleSetFieldLoading(...args: Parameters<(typeof mutations)['setFieldLoading']>) {
			return mutations.setFieldLoading(...args);
		}
	};

	const target = {
		mutations,
		actions,
		getters,
		utils,
		events,
		dispatches
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
		name: '',
		bindings: {},
		events: {},
		mutations: {}
	} as FormItemStoreState;

	const mutations = {
		setName(payload: FormItemStoreState['name']) {
			store.name = payload;
		},
		setBindings(payload: FormItemStoreState['bindings']) {
			store.bindings = payload;
		},
		setEvents(payload: FormItemStoreState['events']) {
			store.events = payload;
		},
		setMutations(payload: FormItemStoreState['mutations']) {
			store.mutations = payload;
		}
	};

	const metrics = {
		consumed: false
	};

	const actions = {};

	const getters = {
		get bindings() {
			return store.bindings;
		},
		get name() {
			return store.name;
		},
		get events() {
			return store.events;
		},
		get mutations() {
			return store.mutations;
		}
	};

	const utils = {
		setConsumed() {
			metrics.consumed = true;
		},
		judgeConsumed() {
			return metrics.consumed;
		}
	};

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
