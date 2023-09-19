import type { RuleItem, ValidateError, ValidateFieldsError, Values } from 'async-validator/dist-types/interface';
import type { TArrayOrPrimitive, TArrayMember, PropReadable } from '$lib/types';

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

export type FormItemValue = TArrayOrPrimitive<string | number | File | undefined | null>;

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
	model: Record<FormFieldProp, FormItemValue>; // Can be Deep level data.
	fields: Array<FormField>;
	rules: FormItemNamedRules;
}

export type FormFieldPicker = Partial<Pick<TArrayMember<FormStoreState['fields']>, 'name' | 'prop'>>;

export type FormItemStoreState = {
	name: FormField['name']; // Field name.
	bindings: PropReadable<
		{
			// Here will be Readonly.
			value: FormItemValue;
		} & Pick<FormField, 'loading' | 'readonly' | 'disabled' | 'validating' | 'prop'>
	>;
};

export type FormValidatePromiseError = Error & {
	errors: ValidateError[] | null;
	fields: ValidateFieldsError | Values;
};
