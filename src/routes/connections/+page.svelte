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
	import { LoadingArea, MainTabType } from '$lib/types';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import {
		fetchEstablishConnection,
		fetchGetConnections,
		fetchRefreshScanRedisAllKeys,
		fetchReleaseConnection,
		fetchRemoveConnection,
		fetchSaveConnection,
		fetchScanRedisAllKeys
	} from '$lib/apis';
	import { fetchCreateNewKey, fetchListRedisClientMetrics, fetchRemoveKey } from '$lib/apis';
	import Main from './Main.svelte';
	import { invokeErrorHandle, invokeOperationSuccessHandle } from '$lib/utils/page';
	import NewConnectionDialog from './NewConnectionDialog.svelte';
	import NewKeyDialog from './NewKeyDialog.svelte';
	import { merge, remove, get as lodashGet } from 'lodash-es';
	import EditConnectionDialog from './EditConnectionDialog.svelte';
	import { createLoadingMisc } from '$lib/utils/appearance';

	const loadingMisc = createLoadingMisc();

	let pageConnections: PageConnections = [];
	let mainTabsConfig = {
		tabs: [] as MainTabs,
		activeIdx: 0
	};
	let newConnectionDialogOpened = false;
	let newKeyDialogConfig = {
		opened: false,
		currentGuid: ''
	};
	let editConnectionDialogConfig = {
		opened: false,
		currentConnection: null as IpcConnection | null
	};
	let grepContent = '';

	function listAllKeys(
		guid: IpcConnection['guid'],
		options?: Partial<{ useRefresh: boolean; refreshOffset: number; useLoadMore: boolean }>
	) {
		return (
			lodashGet(options, 'useRefresh')
				? fetchRefreshScanRedisAllKeys(guid, grepContent, lodashGet(options, 'refreshOffset'))
				: fetchScanRedisAllKeys(guid, grepContent)
		)
			.then((res) => {
				const allKeys = res.data;
				if (!Array.isArray(allKeys)) {
					return res;
				}

				const targetTab = mainTabsConfig.tabs.find(
					(tab) => tab.type === MainTabType.Dashboard && tab.data.connectionInfo.guid === guid
				);
				if (!targetTab) {
					return res;
				}

				const tab = targetTab as Extract<
					MainTab,
					{
						type: MainTabType.Dashboard;
					}
				>;

				tab.data.keys = lodashGet(options, 'useLoadMore') ? (tab.data.keys || []).concat(allKeys) : allKeys;
				mainTabsConfig.tabs = mainTabsConfig.tabs;
			})
			.catch(invokeErrorHandle);
	}

	function previewKey(guid: IpcConnection['guid'], key: string) {
		const existedIdx = mainTabsConfig.tabs.findIndex(
			(tab) => tab.type === MainTabType.KeyDetail && tab.data.key === key && tab.data.connectionInfo.guid === guid
		);
		if (existedIdx !== -1) {
			mainTabsConfig.activeIdx = existedIdx;
			return;
		}

		const targetConnection = pageConnections.find(function (conn) {
			return conn.info.guid === guid;
		});
		if (!targetConnection) {
			return;
		}

		mainTabsConfig.tabs.push({
			type: MainTabType.KeyDetail,
			data: {
				connectionInfo: targetConnection.info,
				db: 0,
				key
			}
		});

		mainTabsConfig.tabs = mainTabsConfig.tabs;
		mainTabsConfig.activeIdx = mainTabsConfig.tabs.length - 1;
	}

	function refreshAllKeys(guid: IpcConnection['guid']) {
		return loadingMisc.wrapPromise(listAllKeys(guid, { useRefresh: true }), [LoadingArea.DashboardKeys]);
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

	function handleCreateNewKey(
		e: CustomEvent<{
			guid: IpcConnection['guid'];
		}>
	) {
		const guid = e.detail.guid;
		if (!guid) {
			return;
		}

		newKeyDialogConfig.opened = true;
		newKeyDialogConfig.currentGuid = guid;
	}

	function handleGrepKeys(
		e: CustomEvent<{
			guid: IpcConnection['guid'];
			conditionPart: string;
		}>
	) {
		const { guid, conditionPart } = e.detail;
		if (!guid) {
			return;
		}

		grepContent = conditionPart;

		return listAllKeys(guid);
	}

	function handleCloseNewKeyDialog() {
		newKeyDialogConfig.opened = false;
		newKeyDialogConfig.currentGuid = '';
	}

	function handleConfirmCreateNewConnection(payload: SaveIpcConnectionPayload) {
		return loadingMisc.wrapPromise(
			fetchSaveConnection(payload)
				.then(invokeOperationSuccessHandle)
				.then(() => {
					return getConnections().then(() => payload);
				})
		);
	}

	function handleConfirmEditConnection(payload: SaveIpcConnectionPayload) {
		if (!editConnectionDialogConfig.currentConnection) {
			return;
		}

		// Attach the guid.
		// Mark this 'save connection' operation is aimed to 'edit' existed connection.
		payload = merge(payload, {
			guid: editConnectionDialogConfig.currentConnection.guid
		});

		return loadingMisc.wrapPromise(
			fetchSaveConnection(payload)
				.then(invokeOperationSuccessHandle)
				.then(() => {
					return getConnections().then(() => payload);
				})
		);
	}

	function handleConfirmCreateNewKey(payload: SaveIpcNewKeyPayload) {
		if (!newKeyDialogConfig.currentGuid) {
			return;
		}

		return loadingMisc.wrapPromise(
			fetchCreateNewKey(newKeyDialogConfig.currentGuid, payload)
				.then(invokeOperationSuccessHandle)
				.then(() => previewKey(newKeyDialogConfig.currentGuid, payload.name))
				.then(() => listAllKeys(newKeyDialogConfig.currentGuid, { useRefresh: true, refreshOffset: 1 }))
				.then(() => payload)
				.catch(invokeErrorHandle)
		);
	}

	function handleConfirmConnection(e: CustomEvent<IpcConnection>) {
		const connection = e.detail;

		if (pageConnections.some((pc) => pc.info.guid === connection.guid && pc.selected)) {
			const existedIdx = mainTabsConfig.tabs.findIndex(
				(tab) => tab.type === MainTabType.Dashboard && tab.data.connectionInfo.guid === connection.guid
			);
			if (existedIdx !== -1) {
				mainTabsConfig.activeIdx = existedIdx;
				return;
			}
		}

		// Using refresh in case the config had already connected.
		loadingMisc.wrapPromise(
			fetchEstablishConnection(connection.guid)
				.then(() =>
					Promise.all([fetchListRedisClientMetrics(connection.guid), fetchRefreshScanRedisAllKeys(connection.guid)])
				)
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

					mainTabsConfig.tabs.push({
						type: MainTabType.Dashboard,
						data: {
							metrics: metricsRes.data,
							connectionInfo: connection,
							keys: targetConnection.keys
						}
					});

					pageConnections = pageConnections;
					mainTabsConfig.tabs = mainTabsConfig.tabs;
					mainTabsConfig.activeIdx = mainTabsConfig.tabs.length - 1;
				})
				.catch(invokeErrorHandle)
		);
	}

	function handleReleaseConnection(e: CustomEvent<IpcConnection>) {
		const connection = e.detail;

		return loadingMisc.wrapPromise(
			fetchReleaseConnection(connection.guid)
				.then(() => {
					pageConnections.forEach(function (conn) {
						if (conn.info.guid === connection.guid) {
							conn.selected = false;
						}
					});
					remove(mainTabsConfig.tabs, function (tab) {
						return tab.data.connectionInfo.guid === connection.guid;
					});

					mainTabsConfig.tabs = mainTabsConfig.tabs;
					// If activeIdx is not a valid idx.
					// Reset it as the last item idx.
					if (mainTabsConfig.activeIdx < 0 || mainTabsConfig.activeIdx >= mainTabsConfig.tabs.length) {
						mainTabsConfig.activeIdx = Math.max(mainTabsConfig.tabs.length - 1, 0);
					}

					pageConnections = pageConnections;
				})
				.catch(invokeErrorHandle)
		);
	}

	function handleRemoveConnection(e: CustomEvent<IpcConnection>) {
		const connection = e.detail;

		return loadingMisc.wrapPromise(
			fetchRemoveConnection(connection.guid)
				.then(() => {
					const removedConnections = remove(pageConnections, function (conn) {
						return conn.info.guid === connection.guid;
					});

					remove(mainTabsConfig.tabs, function (tab) {
						return tab.data.connectionInfo.guid === connection.guid;
					});

					pageConnections = pageConnections;
					mainTabsConfig.tabs = mainTabsConfig.tabs;

					const pendingTasks: Promise<any>[] = [];
					removedConnections.forEach(function (conn) {
						if (conn.selected) {
							pendingTasks.push(fetchReleaseConnection(conn.info.guid));
						}
					});

					// Use allSettled. Ignore the failure.
					return Promise.allSettled(pendingTasks);
				})
				.then(getConnections)
				.catch(invokeErrorHandle)
		);
	}

	function handleEditConnection(e: CustomEvent<IpcConnection>) {
		const connection = e.detail;

		const isTargetConnectionEstablished = pageConnections.some(function (conn) {
			return conn.info.guid === connection.guid && conn.selected;
		});
		if (isTargetConnectionEstablished) {
			return loadingMisc.wrapPromise(
				handleReleaseConnection(e).then(() => {
					editConnectionDialogConfig.opened = true;
					editConnectionDialogConfig.currentConnection = connection;
				})
			);
		}

		editConnectionDialogConfig.opened = true;
		editConnectionDialogConfig.currentConnection = connection;
	}

	function handleLoadMoreKeys(
		e: CustomEvent<{
			guid: IpcConnection['guid'];
		}>
	) {
		return loadingMisc.wrapPromise(listAllKeys(e.detail.guid, { useLoadMore: true }), [LoadingArea.DashboardKeys]);
	}

	function handleRefreshKeys(
		e: CustomEvent<{
			guid: IpcConnection['guid'];
		}>
	) {
		return refreshAllKeys(e.detail.guid);
	}

	function handleRemoveKey(
		e: CustomEvent<{
			guid: IpcConnection['guid'];
			key: string;
		}>
	) {
		const { key, guid } = e.detail;
		return loadingMisc.wrapPromise(
			fetchRemoveKey(guid, key)
				.then(invokeOperationSuccessHandle)
				.then(() => listAllKeys(guid, { useRefresh: true }))
				.catch(invokeErrorHandle),
			[LoadingArea.DashboardKeys]
		);
	}

	function handlePreviewKey(
		e: CustomEvent<{
			guid: IpcConnection['guid'];
			key: string;
		}>
	) {
		const { key, guid } = e.detail;

		return previewKey(guid, key);
	}

	function handleChooseTab(
		e: CustomEvent<{
			idx: number;
		}>
	) {
		const { idx } = e.detail;
		if (idx < 0 || idx >= mainTabsConfig.tabs.length) {
			return;
		}

		mainTabsConfig.activeIdx = idx;
	}

	function handleCloseTab(
		e: CustomEvent<{
			idx: number;
		}>
	) {
		const { idx } = e.detail;
		if (idx < 0 || idx >= mainTabsConfig.tabs.length) {
			return;
		}

		mainTabsConfig.tabs.splice(idx, 1);
		mainTabsConfig.tabs = mainTabsConfig.tabs;

		// If activeIdx is not a valid idx.
		// Reset it as the last item idx.
		if (mainTabsConfig.activeIdx < 0 || mainTabsConfig.activeIdx >= mainTabsConfig.tabs.length) {
			mainTabsConfig.activeIdx = Math.max(mainTabsConfig.tabs.length - 1, 0);
		}
	}

	function handleSwitchDb(
		e: CustomEvent<{
			guid: IpcConnection['guid'];
			db: number;
		}>
	) {
		return refreshAllKeys(e.detail.guid);
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
		bind:tabs={mainTabsConfig.tabs}
		bind:activeIdx={mainTabsConfig.activeIdx}
		on:loadMoreKeys={handleLoadMoreKeys}
		on:refreshKeys={handleRefreshKeys}
		on:createNewKey={handleCreateNewKey}
		on:grepKeys={handleGrepKeys}
		on:removeKey={handleRemoveKey}
		on:previewKey={handlePreviewKey}
		on:chooseTab={handleChooseTab}
		on:closeTab={handleCloseTab}
		on:switchDb={handleSwitchDb}
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
