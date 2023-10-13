export enum Theme {
	System = 'system',
	Dark = 'dark',
	Light = 'light'
}

export type Themes = Array<{
	labelTranslationKey: string;
	value: Theme;
}>;

export type Language = `${string}-${Uppercase<string>}`;

export type Languages = Array<{
	labelTranslationKey: string;
	value: Language;
}>;

export interface Settings {
	theme: Theme;
	language: Language;
	fontFamily: string[];
	redisEachScanCount: number;
}

export interface SettingsPresets {
	themes: Themes;
	languages: Languages;
}

export interface SettingsResources {
	presets: SettingsPresets;
	settings: Settings;
}
