<script lang="ts">
	import Aside from './Aside.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Form from '$lib/components/form/Form.svelte';
	import FormItem from '$lib/components/form/FormItem.svelte';
	import Input from '$lib/components/Input.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	// import Select from '$lib/components/Select.svelte';
	import InputNumber from '$lib/components/InputNumber.svelte';
	import type { SelectOptions, TranslateResults } from '$lib/types';
	import { get, writable } from 'svelte/store';
	import constants from '$lib/constants';
	import Button from '$lib/components/Button.svelte';
	import { translator } from '$lib/utils/translator';
	import { cloneDeep, merge } from 'lodash-es';
	import type { IpcConnection, IpcConnections } from '$lib/types/ipc';
	import { fetchSaveConnection, fetchGetConnections } from '$lib/apis';

	const MAX_PORT_NUM = constants.numbers.MAX_PORT_NUM;
	const MIN_PORT_NUM = constants.numbers.MIN_PORT_NUM;

	let dialogOpened = false;
	let connections: IpcConnections = [];
	const selectOptions: SelectOptions = [
		{ label: 'Sling', value: 1 },
		{ label: 'Wang', value: 2 }
	];
	let formIns: undefined | Form;

	function handleNewConnection() {
		dialogOpened = true;
	}

	function handleConfirmConnection() {
		// Nothing yet.
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
				console.error(e);
			});
	}

	function handleTriggerCancel() {
		handleDialogClose();
	}

	function getConnections() {
		return fetchGetConnections().then(function (res) {
			if (Array.isArray(res.data)) {
				connections = res.data;

				// connections = connections;
			}

			return res;
		});
	}

	// Trigger immediately.
	getConnections();

	const translations = {} as TranslateResults;
	const calcTranslations = function calcTranslations() {
		merge(translations, {
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
		});
	};
	translator.subscribe(function (translations) {
		calcTranslations();
	});

	const model = writable({
		host: '127.0.0.1',
		port: 6379,
		password: '',
		username: '',
		connectionName: '',
		separator: ':',
		readonly: false
	} as IpcConnection);
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
	<div class="tauri-redis-content">Main.</div>
	{#if dialogOpened}
		<Dialog
			class="tauri-redis-dialog tauri-redis-dialog__new-connection"
			bind:header={translations['new connection']}
			still
			on:close={handleDialogClose}
		>
			<div class="tauri-redis-new-connection">
				<Form class="new-connection-form" {model} {rules} bind:this={formIns}>
					<FormItem bind:label={translations['host']} required prop="host"><Input bind:value={$model.host} /></FormItem>
					<FormItem bind:label={translations['port']} required prop="port">
						<InputNumber bind:value={$model.port} maximum={MAX_PORT_NUM} minimum={MIN_PORT_NUM} />
					</FormItem>
					<FormItem bind:label={translations['username']} prop="username"
						><Input bind:value={$model.username} /></FormItem
					>
					<FormItem bind:label={translations['password']} prop="password"
						><Input type="password" bind:value={$model.password} /></FormItem
					>
					<FormItem bind:label={translations['connection nickname']} prop="connectionName"
						><Input bind:value={$model.connectionName} type="textarea" /></FormItem
					>
					<FormItem bind:label={translations['key separator']}><Input bind:value={$model.separator} /></FormItem>
					<!--					<FormItem labe="Demo Select"><Select options={selectOptions} /></FormItem>-->
					<FormItem prop="readonly">
						<Checkbox bind:label={translations['readonly']} bind:checked={$model.readonly} />
					</FormItem>
					<svelte:fragment slot="footer">
						<Button type="primary" on:click={handleTriggerCreate}>{translations['create']}</Button>
						<Button on:click={handleTriggerCancel}>{translations['cancel']}</Button>
					</svelte:fragment>
				</Form>
			</div>
		</Dialog>
	{/if}
</section>
