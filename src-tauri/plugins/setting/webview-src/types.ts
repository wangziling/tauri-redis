export enum Theme {
	System = 'system',
	Dark = 'dark',
	Light = 'light'
}

export type Themes = Array<{
	labelTranslationKey: string;
	value: Theme;
}>;

export interface Settings {
	theme: Theme;
	themes: Themes;
	language: `${string}-${Uppercase<string>}`;
	fontFamily: string[];
	redisEachScanCount: number;
}
