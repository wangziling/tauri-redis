import type { Readable, Writable } from 'svelte/store';

export type CalcDynamicClassesParamsItem = string | Record<string, any>;

export type CalcDynamicClassesParams = CalcDynamicClassesParamsItem | Array<CalcDynamicClassesParamsItem>;

export type PropWritable<T extends Record<string, any>> = {
	[key in keyof T]: T[key] extends Writable<infer V> ? Writable<V> : Writable<T[key]>;
};

export type PropReadable<T extends Record<string, any>> = {
	[key in keyof T]: T[key] extends Readable<infer V> ? Readable<V> : Readable<T[key]>;
};

export type Raw<T> = T extends Writable<infer V> ? V : T extends Readable<infer V> ? V : never;

// Lorem ipsum dolor sit amet.
// Lorem ipsum {0} sit amet. ----- {0} will be replaced by .translate(__, 'the content for 0');
export type TranslationContent = string;

export interface TranslationItem {
	content: TranslationContent;
	isPlainText?: boolean;
}

// Key: xxxx
// Key: xxxx|Default content.
export type TranslationKey = `${Lowercase<string>}` | `${Lowercase<string>}|${TranslationContent}` | string;

export type Translations = Record<TranslationKey, TranslationItem>;

// zh-CN, en-US.
export type TranslationLanguage = `${string}-${Uppercase<string>}`;

export type TranslateResults = Record<TranslationKey, TranslationContent>;
