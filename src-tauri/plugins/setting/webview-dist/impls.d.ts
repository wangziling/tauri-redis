/// <reference types="svelte" />
import { Writable } from 'svelte/store';
import { fetchGet, fetchSet, fetchReset, fetchGetPreset } from './ipc';
import { SettingsResources, Theme } from './types';
declare class Settings {
    private _resources;
    private _update;
    constructor();
    resources(): Promise<SettingsResources>;
    presets(): Promise<SettingsResources>;
    settings(): Promise<SettingsResources>;
    get<T = any>(...args: Parameters<typeof fetchGet>): Promise<T>;
    getPreset<T = any>(...args: Parameters<typeof fetchGetPreset>): Promise<T>;
    set(...args: Parameters<typeof fetchSet>): Promise<void>;
    reset(...args: Parameters<typeof fetchReset>): Promise<void>;
    getTheme(): Promise<Theme>;
    getLanguage(): Promise<string>;
    subscribe(...args: Parameters<Writable<SettingsResources>['subscribe']>): import("svelte/store").Unsubscriber;
    derived(callback?: (resources: SettingsResources) => any): import("svelte/store").Readable<SettingsResources>;
}
export declare const settings: Settings;
export {};
