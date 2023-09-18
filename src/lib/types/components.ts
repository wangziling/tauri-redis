import type { RuleItem } from 'async-validator/dist-types/interface';
import type { TArrayOrPrimitive } from '$lib/types/base';

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
			metrics: {
				rule: any;
			};
	  };

export interface FormItemMessageInfo {
	message: string; // Maybe HTML Content.
	type: FormItemMessageType;
	reason?: FormItemMessageReason;
}

export type FormItemRules = Array<RuleItem>;

export type FormItemNamedRules = Record<string, FormItemRules>;

export type FormItemValue = TArrayOrPrimitive<string | number | File | undefined | null>;

export type FormField = {
	prop: string;
	name: string;
	messageInfo?: FormItemMessageInfo;
	required: boolean;
	loading: boolean;
	disabled: boolean;
	readonly: boolean;
	validating: boolean;
	rules: FormItemRules;
};

export interface FormStoreState {
	name: string; // Form name.
	model: Record<string, FormItemValue>;
	fields: Array<FormField>;
}
