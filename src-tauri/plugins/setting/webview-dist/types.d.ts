export declare enum Themes {
    Auto = "auto",
    Dark = "dark",
    Light = "light"
}
export interface Settings {
    theme: Themes;
    language: `${string}-${Uppercase<string>}`;
    fontFamily: string[];
    redisEachScanCount: number;
}
