<script lang="ts">
	import Aside from './Aside.svelte';
	import type {
		IpcConnection,
		MainTab,
		MainTabs,
		PageConnections,
		SaveIpcConnectionPayload,
		SaveIpcNewKeyPayload
	} from '$lib/types';
	import { MainTabType } from '$lib/types';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import {
		fetchEstablishConnection,
		fetchGetConnections,
		fetchReleaseConnection,
		fetchRemoveConnection,
		fetchSaveConnection
	} from '$lib/apis';
	import { fetchCreateNewKey, fetchListRedisAllKeys, fetchListRedisClientMetrics } from '$lib/apis/redis-client';
	import Main from './Main.svelte';
	import { invokeErrorHandle } from '$lib/utils/page';
	import NewConnectionDialog from './NewConnectionDialog.svelte';
	import NewKeyDialog from './NewKeyDialog.svelte';
	import { debounce, remove } from 'lodash-es';
	import EditConnectionDialog from './EditConnectionDialog.svelte';

	let pageConnections: PageConnections = [];
	let mainTabs: MainTabs = [];
	let newConnectionDialogOpened = false;
	let newKeyDialogConfig = {
		opened: false,
		currentGuid: ''
	};
	let editConnectionDialogConfig = {
		opened: false,
		currentConnection: null as IpcConnection | null
	};

	function listAllKeys(guid: IpcConnection['guid'], conditionPart?: string) {
		return fetchListRedisAllKeys(guid, conditionPart).then((res) => {
			const allKeys = res.data;
			if (!Array.isArray(allKeys)) {
				return res;
			}

			const targetTab = mainTabs.find(
				(tab) => tab.type === MainTabType.Dashboard && tab.data.connectionInfo.guid === guid
			);
			if (!targetTab) {
				return res;
			}

			(targetTab as Extract<MainTab, { type: MainTabType.Dashboard }>).data.keys = allKeys;
			mainTabs = mainTabs;
		});
	}

	function handleNewConnection() {
		newConnectionDialogOpened = true;
	}

	function handleCloseNewConnectionDialog() {
		newConnectionDialogOpened = false;
	}

	function handleCloseEditConnectionDialog() {
		editConnectionDialogConfig.opened = false;
		editConnectionDialogConfig.currentConnection = null;
	}

	function handleCreateNewKey(e: CustomEvent<{ guid: IpcConnection['guid'] }>) {
		const guid = e.detail.guid;
		if (!guid) {
			return;
		}

		newKeyDialogConfig.opened = true;
		newKeyDialogConfig.currentGuid = guid;
	}

	function handleGrepKeys(e: CustomEvent<{ guid: IpcConnection['guid']; conditionPart: string }>) {
		const { guid, conditionPart } = e.detail;
		if (!guid) {
			return;
		}

		return listAllKeys(guid, conditionPart);
	}

	function handleCloseNewKeyDialog() {
		newKeyDialogConfig.opened = false;
		newKeyDialogConfig.currentGuid = '';
	}

	function handleConfirmCreateNewConnection(payload: SaveIpcConnectionPayload) {
		return fetchSaveConnection(payload).then(() => {
			return getConnections().then(() => payload);
		});
	}

	function handleConfirmEditConnection(payload: SaveIpcConnectionPayload) {
		return fetchSaveConnection(payload).then(() => {
			return getConnections().then(() => payload);
		});
	}

	function handleConfirmCreateNewKey(payload: SaveIpcNewKeyPayload) {
		if (!newKeyDialogConfig.currentGuid) {
			return;
		}

		return fetchCreateNewKey(newKeyDialogConfig.currentGuid, payload)
			.then(() => listAllKeys(newKeyDialogConfig.currentGuid))
			.then(() => payload);
	}

	function handleConfirmConnection(e: CustomEvent<IpcConnection>) {
		const connection = e.detail;

		if (pageConnections.some((pc) => pc.info.guid === connection.guid && pc.selected)) {
			return;
		}

		fetchEstablishConnection(connection.guid)
			.then(() => Promise.all([fetchListRedisClientMetrics(connection.guid), fetchListRedisAllKeys(connection.guid)]))
			.then(([metricsRes, keysRes]) => {
				const keys = keysRes.data;
				const targetConnection = pageConnections.find(function (conn) {
					return conn.info.guid === connection.guid;
				});
				if (targetConnection) {
					targetConnection.selected = true;

					if (Array.isArray(keys)) {
						targetConnection.keys = keys;
					}
				}

				mainTabs.push({
					type: MainTabType.Dashboard,
					data: {
						metrics: metricsRes.data,
						connectionInfo: connection,
						keys: targetConnection.keys
					}
				});

				pageConnections = pageConnections;
				mainTabs = mainTabs;
			})
			.catch(invokeErrorHandle);
	}

	function handleReleaseConnection(e: CustomEvent<IpcConnection>) {
		const connection = e.detail;

		return fetchReleaseConnection(connection.guid)
			.then(() => {
				pageConnections.forEach(function (conn) {
					if (conn.info.guid === connection.guid) {
						conn.selected = false;
					}
				});
				remove(mainTabs, function (tab) {
					return tab.data.connectionInfo.guid === connection.guid;
				});

				mainTabs = mainTabs;
				pageConnections = pageConnections;
			})
			.catch(invokeErrorHandle);
	}

	function handleRemoveConnection(e: CustomEvent<IpcConnection>) {
		const connection = e.detail;

		return fetchRemoveConnection(connection.guid)
			.then(() => {
				const removedConnections = remove(pageConnections, function (conn) {
					return conn.info.guid === connection.guid;
				});
				removedConnections.forEach(function (conn) {
					if (conn.selected) {
						fetchReleaseConnection(conn.info.guid);
					}
				});

				remove(mainTabs, function (tab) {
					return tab.data.connectionInfo.guid === connection.guid;
				});

				pageConnections = pageConnections;
				mainTabs = mainTabs;
			})
			.then(getConnections)
			.catch(invokeErrorHandle);
	}

	function handleEditConnection(e: CustomEvent<IpcConnection>) {
		const connection = e.detail;

		const isTargetConnectionEstablished = pageConnections.some(function (conn) {
			return conn.info.guid === connection.guid && conn.selected;
		});
		if (isTargetConnectionEstablished) {
			return handleReleaseConnection(e).then(() => {
				editConnectionDialogConfig.opened = true;
				editConnectionDialogConfig.currentConnection = connection;
			});
		}

		editConnectionDialogConfig.opened = true;
		editConnectionDialogConfig.currentConnection = connection;
	}

	function handleRefreshKeys(e: CustomEvent<{ guid: IpcConnection['guid'] }>) {
		return listAllKeys(e.detail.guid);
	}

	function getConnections() {
		return fetchGetConnections().then(function (res) {
			if (Array.isArray(res.data)) {
				if (pageConnections.length) {
					pageConnections = res.data.map(function (info) {
						const targetConnection = pageConnections.find(function (conn) {
							return conn.info.guid === info.guid;
						});

						if (targetConnection) {
							return {
								info,
								selected: targetConnection.selected,
								keys: []
							};
						}
						return {
							info,
							selected: false,
							keys: []
						};
					});
				} else {
					pageConnections = res.data.map(function (info) {
						return {
							info,
							selected: false,
							keys: []
						};
					});
				}
			}

			pageConnections = pageConnections;

			return res;
		});
	}

	// Trigger immediately.
	getConnections();

	const translations = translator.derived(function () {
		return {
			'new connection': translator.translate('new connection|New connection'),
			host: translator.translate('host|Host'),
			port: translator.translate('port|Port'),
			username: translator.translate('username|Username'),
			password: translator.translate('password|Password'),
			'connection nickname': translator.translate('connection nickname|Connection nickname'),
			'key separator': translator.translate('key separator|Separator'),
			readonly: translator.translate('readonly|Readonly'),
			create: translator.translate('create|Create'),
			cancel: translator.translate('cancel|Cancel'),
			connections: translator.translate('connections|Connections'),
			'this project description': translator.translate('this project description|Tauri redis.')
		};
	});
</script>

<svelte:head>
	<title>{$translations['connections']}</title>
	<meta name="description" content={$translations['this project description']} />
</svelte:head>

<section class="tauri-redis-connections">
	<Aside
		bind:pageConnections
		on:newConnection={handleNewConnection}
		on:confirmConnection={handleConfirmConnection}
		on:removeConnection={handleRemoveConnection}
		on:releaseConnection={handleReleaseConnection}
		on:editConnection={handleEditConnection}
	/>
	<Main
		bind:tabs={mainTabs}
		on:refreshKeys={handleRefreshKeys}
		on:createNewKey={handleCreateNewKey}
		on:grepKeys={debounce(handleGrepKeys, 300)}
	/>
	{#if newConnectionDialogOpened}
		<NewConnectionDialog
			on:close={handleCloseNewConnectionDialog}
			confirmCreateHandler={handleConfirmCreateNewConnection}
		/>
	{/if}
	{#if editConnectionDialogConfig.opened}
		<EditConnectionDialog
			on:close={handleCloseEditConnectionDialog}
			confirmEditHandler={handleConfirmEditConnection}
			bind:connectionInfo={editConnectionDialogConfig.currentConnection}
		/>
	{/if}
	{#if newKeyDialogConfig.opened}
		<NewKeyDialog on:close={handleCloseNewKeyDialog} confirmCreateHandler={handleConfirmCreateNewKey} />
	{/if}
</section>
