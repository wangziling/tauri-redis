export enum Theme {
	System = 'system',
	Dark = 'dark',
	Light = 'light'
}

export type Themes = Array<{
	labelTranslationKey: string;
	value: Theme;
}>;

type Language = `${string}-${Uppercase<string>}`;

export interface Settings {
	theme: Theme;
	language: Language;
	fontFamily: string[];
	redisEachScanCount: number;
}

export interface SettingsPresets {
	themes: Themes;
}

export interface SettingsResources {
	presets: SettingsPresets;
	settings: Settings;
}
