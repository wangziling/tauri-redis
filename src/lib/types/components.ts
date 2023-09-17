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
			type:
				| FormItemMessageReasonType.FormValidation
				| FormItemMessageReasonType.FormFieldValidation;
			metrics: {
				rule: any;
			};
	  };

export interface FormItemMessageInfo {
	message: string; // Maybe HTML Content.
	type: FormItemMessageType;
	reason?: FormItemMessageReason;
}
