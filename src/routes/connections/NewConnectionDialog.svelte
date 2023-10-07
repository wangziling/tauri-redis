<script lang="ts">
	import InputNumber from '$lib/components/InputNumber.svelte';
	import Input from '$lib/components/Input.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import FormItem from '$lib/components/form/FormItem.svelte';
	import Button from '$lib/components/Button.svelte';
	import Form from '$lib/components/form/Form.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import { get, writable } from 'svelte/store';
	import type { SaveIpcConnectionPayload } from '$lib/types';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import constants from '$lib/constants';
	import { cloneDeep } from 'lodash-es';
	import { invokeErrorHandle } from '$lib/utils/page';
	import { createEventDispatcher } from 'svelte';

	const MAX_PORT_NUM = constants.numbers.MAX_PORT_NUM;
	const MIN_PORT_NUM = constants.numbers.MIN_PORT_NUM;

	const dispatch = createEventDispatcher();

	export let confirmCreateHandler: (payload: SaveIpcConnectionPayload) => Promise<SaveIpcConnectionPayload> =
		Promise.resolve;

	let formIns: undefined | Form;

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

	function handleDialogClose() {
		dispatch('close');
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

				return confirmCreateHandler(result);
			})
			.then(function () {
				handleDialogClose();
			})
			.catch(function validateCatch(e) {
				invokeErrorHandle(e, { stopPropagation: true });
			});
	}

	function handleTriggerCancel() {
		handleDialogClose();
	}
</script>

<Dialog
	class="tauri-redis-dialog tauri-redis-dialog__new-connection"
	bind:header={$translations['new connection']}
	still
	on:close={handleDialogClose}
>
	<div class="tauri-redis-new-connection">
		<Form class="new-connection-form" {model} {rules} bind:this={formIns}>
			<FormItem bind:label={$translations['host']} required prop="host"><Input bind:value={$model.host} /></FormItem>
			<FormItem bind:label={$translations['port']} required prop="port">
				<InputNumber bind:value={$model.port} maximum={MAX_PORT_NUM} minimum={MIN_PORT_NUM} />
			</FormItem>
			<FormItem bind:label={$translations['username']} prop="username"><Input bind:value={$model.username} /></FormItem>
			<FormItem bind:label={$translations['password']} prop="password"
				><Input type="password" bind:value={$model.password} /></FormItem
			>
			<FormItem bind:label={$translations['connection nickname']} prop="connectionName"
				><Input bind:value={$model.connectionName} type="textarea" /></FormItem
			>
			<FormItem bind:label={$translations['key separator']}><Input bind:value={$model.separator} /></FormItem>
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
