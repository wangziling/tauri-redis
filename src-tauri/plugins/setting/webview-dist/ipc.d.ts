import { Settings, SettingsPresets, SettingsResources } from './types';
export declare function fetchResources(): Promise<SettingsResources>;
export declare function fetchPresets(): Promise<SettingsPresets>;
export declare function fetchSettings(): Promise<Settings>;
export declare function fetchGet<T = any>(key: keyof Settings): Promise<T>;
export declare function fetchGetPreset<T = any>(key: keyof SettingsPresets): Promise<T>;
export declare function fetchSet(key: keyof Settings, value: any): Promise<void>;
export declare function fetchReset(): Promise<void>;
