/// <reference types="svelte" />
import { Writable } from 'svelte/store';
import { get, set, reset } from './ipc';
import { Settings as Resources, Theme } from './types';
declare class Settings {
    private _resources;
    private _update;
    constructor();
    resources(): Promise<Resources>;
    get<T = any>(...args: Parameters<typeof get>): Promise<T>;
    set(...args: Parameters<typeof set>): Promise<void>;
    reset(...args: Parameters<typeof reset>): Promise<void>;
    getTheme(): Promise<Theme>;
    getLanguage(): Promise<string>;
    subscribe(...args: Parameters<Writable<Resources>['subscribe']>): import("svelte/store").Unsubscriber;
    derived(callback?: (resources: Resources) => any): import("svelte/store").Readable<Resources>;
}
export declare const settings: Settings;
export {};
