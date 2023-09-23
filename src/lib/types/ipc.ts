import type { TranslationLanguage, Translations } from '$lib/types/utils';

export type IpcTranslations = {
	translations: Translations;
	language: TranslationLanguage;
};

export type SaveIpcConnectionPayload = {
	host: IpcConnection['host'];
	port: IpcConnection['port'];
	password?: IpcConnection['password'];
	username?: IpcConnection['username'];
	connectionName?: IpcConnection['connectionName'];
	separator?: IpcConnection['separator'];
	readonly: IpcConnection['readonly'];
	guid?: IpcConnection['guid'];
};

export type IpcConnection = {
	host: string;
	port: number;
	password: string;
	username: string;
	connectionName: string;
	separator: string;
	readonly: boolean;

	guid: string;
	createdAt: string;
	connectedAt: string;
	updatedAt: string;
};

export type IpcConnections = Array<IpcConnection>;

// Lowercase.
export enum IpcResponseStatus {
	Success = 'success',
	Failed = 'failed',
	Warning = 'warning'
}

export interface IpcResponse<D extends unknown = unknown> {
	message: string;
	status: IpcResponseStatus;
	data?: D;
}
