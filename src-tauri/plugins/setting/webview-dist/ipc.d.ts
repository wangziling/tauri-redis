import { Settings } from './types';
export declare function resources(): Promise<Settings>;
export declare function get(key: keyof Settings): Promise<any>;
export declare function set(key: keyof Settings, value: any): Promise<void>;
export declare function reset(): Promise<void>;
