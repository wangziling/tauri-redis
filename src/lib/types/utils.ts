import type { Readable, Writable } from 'svelte/store';

export type CalcDynamicClassesParamsItem = string | Record<string, any>;

export type CalcDynamicClassesParams = CalcDynamicClassesParamsItem | Array<CalcDynamicClassesParamsItem>;

export type PropWritable<T extends Record<string, any>> = {
	[key in keyof T]: Writable<T[key]>;
};

export type PropReadable<T extends Record<string, any>> = {
	[key in keyof T]: Readable<T[key]>;
};
