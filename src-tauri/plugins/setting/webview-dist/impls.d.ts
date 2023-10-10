import { get, resources, set, reset } from './ipc';
declare class Settings {
    resources(...args: Parameters<typeof resources>): Promise<import("./types").Settings>;
    get(...args: Parameters<typeof get>): Promise<any>;
    set(...args: Parameters<typeof set>): Promise<void>;
    reset(...args: Parameters<typeof reset>): Promise<void>;
    getTheme(): Promise<any>;
    getLanguage(): Promise<any>;
}
export declare const settings: Settings;
export {};
