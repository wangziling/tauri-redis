import type { RuleItem, ValidateError, ValidateFieldsError, Values } from 'async-validator/dist-types/interface';
import type { TArrayOrPrimitive, TArrayMember, PropReadable } from '$lib/types';
import type { createEventDispatcher } from 'svelte';
import type { Writable } from 'svelte/store';

export interface SelectOptionItem {
	label: string;
	value: string | number;

	labelUsingHtml?: boolean;
}

export type SelectOptions = Array<SelectOptionItem>;

export enum FormItemMessageType {
	Success = 'Success',
	Warning = 'Warning',
	Error = 'Error',
	Info = 'Info'
}

export enum FormItemMessageReasonType {
	ManualSet = 'ManualSet',
	FormValidation = 'FormValidation',
	FormFieldValidation = 'FormFieldValidation',
	Unexpected = 'Unexpected'
}

export type FormItemMessageReason =
	| {
			type: FormItemMessageReasonType;
			[key: string]: any;
	  }
	| {
			type: FormItemMessageReasonType.FormValidation | FormItemMessageReasonType.FormFieldValidation;
			metrics?: Partial<{
				// Cannot get when using async-validator.
				rule: any;
			}>;
	  };

export interface FormItemMessageInfo {
	message: string; // Maybe HTML Content.
	type: FormItemMessageType;
	reason?: FormItemMessageReason;
}

export enum FormRuleTrigger {
	Change = 'Change',
	Input = 'Input',
	Blur = 'Blur',
	Focus = 'Focus'
}

export type FormRuleItem = RuleItem & {
	trigger?: TArrayOrPrimitive<FormRuleTrigger>;
};

export type FormItemRules = Array<FormRuleItem>;

// Lodash.get() propPath.
// E.g. 'user.name'
export type FormFieldProp = string;

export type FormItemNamedRules = Record<FormFieldProp, FormItemRules>;

export type FormItemValue = TArrayOrPrimitive<string | number | File | undefined | null | boolean>;

export type FormField = {
	prop: FormFieldProp;
	messageInfo?: FormItemMessageInfo;
	required: boolean;
	loading: boolean;
	disabled: boolean;
	readonly: boolean;
	validating: boolean;
	rules: FormItemRules;
	mounted: boolean;

	// Still and uniq.
	name: string;
};

export enum FormLabelPosition {
	Top = 'Top',
	'Left' = 'Left'
}

export interface FormStoreState {
	labelPosition: FormLabelPosition;
	name: string; // Form name.
	model: Writable<Record<FormFieldProp, FormItemValue>>; // Can be Deep level data.
	fields: Array<FormField>;
	rules: Writable<FormItemNamedRules>;
	useRestrictSetFieldValueMode: boolean;
	disabled: boolean;
	readonly: boolean;
}

export type FormFieldPicker = Partial<Pick<TArrayMember<FormStoreState['fields']>, 'name' | 'prop'>>;

export interface FormStoreOptions {
	dispatchCallback: ReturnType<typeof createEventDispatcher>;
}

export type FormItemStoreState = {
	// Field name.
	name: FormField['name'];
	// Here will be Readonly.
	bindings: PropReadable<
		{
			value: FormItemValue;
		} & Pick<FormField, 'loading' | 'readonly' | 'disabled' | 'validating' | 'prop'>
	>;
	events: {
		handleFieldFocus: (e: Event) => any;
		handleFieldBlur: (e: Event) => any;
		handleFieldSetValue: (curValue: FormItemValue, trigger: FormRuleTrigger.Change | FormRuleTrigger.Input) => any;
	};
};

export type FormValidatePromiseError = Error & {
	errors: ValidateError[] | null;
	fields: ValidateFieldsError | Values;
};
