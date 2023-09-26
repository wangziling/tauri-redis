<script lang="ts">
	import Aside from './Aside.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Form from '$lib/components/form/Form.svelte';
	import FormItem from '$lib/components/form/FormItem.svelte';
	import Input from '$lib/components/Input.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	// import Select from '$lib/components/Select.svelte';
	import InputNumber from '$lib/components/InputNumber.svelte';
	import type { IpcConnection, MainTabs, PageConnections, SaveIpcConnectionPayload, SelectOptions } from '$lib/types';
	import { MainTabType } from '$lib/types';
	import { get, writable } from 'svelte/store';
	import constants from '$lib/constants';
	import Button from '$lib/components/Button.svelte';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import { cloneDeep } from 'lodash-es';
	import { fetchEstablishConnection, fetchGetConnections, fetchSaveConnection } from '$lib/apis';
	import { fetchListRedisClientMetrics, fetchListRedisAllKeys } from '$lib/apis/redis-client';
	import Main from './Main.svelte';
	import { invokeErrorHandle } from '$lib/utils/page';

	const MAX_PORT_NUM = constants.numbers.MAX_PORT_NUM;
	const MIN_PORT_NUM = constants.numbers.MIN_PORT_NUM;

	let dialogOpened = false;
	let pageConnections: PageConnections = [];
	let mainTabs: MainTabs = [];

	const selectOptions: SelectOptions = [
		{ label: 'Sling', value: 1 },
		{ label: 'Wang', value: 2 }
	];
	let formIns: undefined | Form;

	function handleNewConnection() {
		dialogOpened = true;
	}

	function handleConfirmConnection(e: CustomEvent<IpcConnection>) {
		const connection = e.detail;

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

	function handleDialogClose() {
		dialogOpened = false;
	}

	function handleTriggerCreate() {
		if (!formIns) {
			return;
		}

		formIns
			.validate()
			.then(function validateThen() {
				let result = get(model);
				if (!result.connectionName) {
					result = cloneDeep(result);

					result.connectionName = result.host + '@' + result.port;
				}

				return fetchSaveConnection(result);
			})
			.then(function () {
				return getConnections();
			})
			.then(function () {
				handleDialogClose();
			})
			.catch(function validateCatch(e) {
				invokeErrorHandle(e);
			});
	}

	function handleTriggerCancel() {
		handleDialogClose();
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

	$: connections = pageConnections.map(function (conn) {
		return conn.info;
	});

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
			cancel: translator.translate('cancel|Cancel')
		};
	});

	const model = writable({
		host: '127.0.0.1',
		port: 6379,
		password: '',
		username: '',
		connectionName: '',
		separator: ':',
		readonly: false
	} as SaveIpcConnectionPayload);
	const rules = writable({
		host: [{ required: true }],
		port: [{ required: true }],
		password: [],
		username: [],
		connectionName: [],
		separator: []
	});
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Tauri redis." />
</svelte:head>

<section class="tauri-redis-page tauri-redis-page-main">
	<Aside bind:connections on:newConnection={handleNewConnection} on:confirmConnection={handleConfirmConnection} />
	<Main bind:tabs={mainTabs} />
	{#if dialogOpened}
		<Dialog
			class="tauri-redis-dialog tauri-redis-dialog__new-connection"
			bind:header={$translations['new connection']}
			still
			on:close={handleDialogClose}
		>
			<div class="tauri-redis-new-connection">
				<Form class="new-connection-form" {model} {rules} bind:this={formIns}>
					<FormItem bind:label={$translations['host']} required prop="host"><Input bind:value={$model.host} /></FormItem
					>
					<FormItem bind:label={$translations['port']} required prop="port">
						<InputNumber bind:value={$model.port} maximum={MAX_PORT_NUM} minimum={MIN_PORT_NUM} />
					</FormItem>
					<FormItem bind:label={$translations['username']} prop="username"
						><Input bind:value={$model.username} /></FormItem
					>
					<FormItem bind:label={$translations['password']} prop="password"
						><Input type="password" bind:value={$model.password} /></FormItem
					>
					<FormItem bind:label={$translations['connection nickname']} prop="connectionName"
						><Input bind:value={$model.connectionName} type="textarea" /></FormItem
					>
					<FormItem bind:label={$translations['key separator']}><Input bind:value={$model.separator} /></FormItem>
					<!--					<FormItem labe="Demo Select"><Select options={selectOptions} /></FormItem>-->
					<FormItem prop="readonly">
						<Checkbox bind:label={$translations['readonly']} bind:checked={$model.readonly} />
					</FormItem>
					<svelte:fragment slot="footer">
						<Button type="primary" on:click={handleTriggerCreate}>{$translations['create']}</Button>
						<Button on:click={handleTriggerCancel}>{$translations['cancel']}</Button>
					</svelte:fragment>
				</Form>
			</div>
		</Dialog>
	{/if}
</section>
