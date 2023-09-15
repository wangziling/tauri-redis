export interface SelectOptionItem {
	label: string;
	value: string | number;

	labelUsingHtml?: boolean;
}

export type SelectOptions = Array<SelectOptionItem>;
