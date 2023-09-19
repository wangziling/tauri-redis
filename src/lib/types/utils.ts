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
