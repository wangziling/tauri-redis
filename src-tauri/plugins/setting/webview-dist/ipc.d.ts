import { Settings } from './types';
export declare function resources(): Promise<Settings>;
export declare function get<T = any>(key: keyof Settings): Promise<T>;
export declare function set(key: keyof Settings, value: any): Promise<void>;
export declare function reset(): Promise<void>;
