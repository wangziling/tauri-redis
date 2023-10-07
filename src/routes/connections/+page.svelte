<script lang="ts">
	import Aside from './Aside.svelte';
	import type {
		IpcConnection,
		MainTabs,
		PageConnections,
		SaveIpcConnectionPayload,
		SaveIpcNewKeyPayload
	} from '$lib/types';
	import { MainTabType } from '$lib/types';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import { fetchEstablishConnection, fetchGetConnections, fetchSaveConnection } from '$lib/apis';
	import { fetchListRedisAllKeys, fetchListRedisClientMetrics } from '$lib/apis/redis-client';
	import Main from './Main.svelte';
	import { invokeErrorHandle } from '$lib/utils/page';
	import NewConnectionDialog from './NewConnectionDialog.svelte';
	import NewKeyDialog from './NewKeyDialog.svelte';

	let pageConnections: PageConnections = [];
	let mainTabs: MainTabs = [];
	let newKeyDialogOpened = false;
	let newConnectionDialogOpened = false;

	function handleNewConnection() {
		newConnectionDialogOpened = true;
	}

	function handleCloseNewConnectionDialog() {
		newConnectionDialogOpened = false;
	}

	function handleCloseNewKeyDialog() {
		newKeyDialogOpened = false;
	}

	function handleConfirmCreateNewConnection(payload: SaveIpcConnectionPayload) {
		return fetchSaveConnection(payload).then(() => {
			return getConnections().then(() => payload);
		});
	}

	function handleConfirmCreateNewKey(payload: SaveIpcNewKeyPayload) {
		return Promise.resolve(payload);
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
			// .then(() => fetchReleaseConnection(connection.guid))
			// .then(() => fetchRemoveConnection(connection.guid))
			// .then(() => getConnections())
			.catch(invokeErrorHandle);
	}

	function handleRefreshKeys(e: CustomEvent<{ guid: IpcConnection['guid'] }>) {
		const guid = e.detail.guid;

		return fetchListRedisAllKeys(guid).then((res) => {
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

			targetTab.data.keys = allKeys;
			mainTabs = mainTabs;
		});
	}

	function handleCreateNewKey(e: CustomEvent<{ guid: IpcConnection['guid'] }>) {
		const guid = e.detail.guid;

		newKeyDialogOpened = true;
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
	<Aside bind:pageConnections on:newConnection={handleNewConnection} on:confirmConnection={handleConfirmConnection} />
	<Main bind:tabs={mainTabs} on:refreshKeys={handleRefreshKeys} on:createNewKey={handleCreateNewKey} />
	{#if newConnectionDialogOpened}
		<NewConnectionDialog
			on:close={handleCloseNewConnectionDialog}
			confirmCreateHandler={handleConfirmCreateNewConnection}
		/>
	{/if}
	{#if newKeyDialogOpened}
		<NewKeyDialog on:close={handleCloseNewKeyDialog} confirmCreateHandler={handleConfirmCreateNewKey} />
	{/if}
</section>
