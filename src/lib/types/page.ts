import type { IpcClientKeys, IpcClientMetrics, IpcConnection } from '$lib/types/ipc';

export enum PageTheme {
	Light = 'Light',
	Dark = 'Dark'
}

export type PageConnections = Array<{
	info: IpcConnection;
	selected: boolean;
	keys: IpcClientKeys;
}>;

export enum MainTabType {
	Dashboard = 'Dashboard',
	KeyDetail = 'KeyDetail'
}

export type MainTab =
	| {
			type: MainTabType;
			data: {
				connectionInfo: IpcConnection;
				[key: string]: any;
			};
	  }
	| {
			type: MainTabType.Dashboard;
			data: {
				metrics: IpcClientMetrics;
				connectionInfo: IpcConnection;
				keys: IpcClientKeys;
			};
	  }
	| {
			type: MainTabType.KeyDetail;
			data: {
				key: string;
				db: number;
				connectionInfo: IpcConnection;
			};
	  };

export type MainTabs = Array<MainTab>;
