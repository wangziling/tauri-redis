<script lang="ts">
	import { invoke } from '@tauri-apps/api/tauri';
	import Aside from './Aside.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Form from '$lib/components/form/Form.svelte';
	import FormItem from '$lib/components/form/FormItem.svelte';
	import Input from '$lib/components/Input.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import Select from '$lib/components/Select.svelte';
	import type { SelectOptions } from '$lib/types';

	let name = 'Sling';
	let greetMsg = '';
	let dialogOpened = false;
	const selectOptions: SelectOptions = [
		{ label: 'Sling', value: 1 },
		{ label: 'Wang', value: 2 }
	];

	async function greet() {
		// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
		greetMsg = await invoke('greet', { name });
	}

	async function async_greet() {
		console.log(await invoke('async_greet', { name, test: '1' }));
	}

	async function get_web_content() {
		console.log(await invoke('get_web_content', { name, uri: 'https://baidu.com' }));
	}

	function handleNewConnection() {
		dialogOpened = true;
		// return Promise.allSettled([async_greet(), greet(), get_web_content()]);
	}

	function handleDialogClose() {
		dialogOpened = false;
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Tauri redis." />
</svelte:head>

<section class="tauri-redis-page tauri-redis-page-main">
	<Aside on:newConnection={handleNewConnection} />
	<div class="tauri-redis-content">Main.</div>
	{#if dialogOpened}
		<Dialog
			class="tauri-redis-dialog tauri-redis-dialog__new-connection"
			header="New connection"
			on:close={handleDialogClose}
		>
			<div class="tauri-redis-new-connection">
				<Form class="new-connection-form">
					<FormItem label="Hosts" required prop="hosts"><Input /></FormItem>
					<FormItem label="Port" required><Input /></FormItem>
					<FormItem labe="Demo Select"><Select options={selectOptions} /></FormItem>
					<FormItem labe="Demo Checkbox">
						<Checkbox label="Hello World." />
					</FormItem>
				</Form>
			</div>
		</Dialog>
	{/if}
</section>
