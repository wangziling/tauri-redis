<script lang="ts">
	import Select from '$lib/components/Select.svelte';
	import Input from '$lib/components/Input.svelte';
	import FormItem from '$lib/components/form/FormItem.svelte';
	import Button from '$lib/components/Button.svelte';
	import Form from '$lib/components/form/Form.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import { get, writable } from 'svelte/store';
	import type { SaveIpcNewKeyPayload, SelectOptions } from '$lib/types';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import { cloneDeep } from 'lodash-es';
	import { invokeErrorHandle } from '$lib/utils/page';
	import { createEventDispatcher } from 'svelte';
	import { IpcKeyType } from '$lib/types';

	const dispatch = createEventDispatcher();

	export let confirmCreateHandler: (payload: SaveIpcNewKeyPayload) => Promise<SaveIpcNewKeyPayload> = Promise.resolve;

	let formIns: undefined | Form;

	const translations = translator.derived(function () {
		return {
			'create new key': translator.translate('create new key|Create new key'),
			'key name': translator.translate('key name|Key name'),
			'key type': translator.translate('key type|Key type'),
			create: translator.translate('create|Create'),
			cancel: translator.translate('cancel|Cancel')
		};
	});

	const selectOptions: SelectOptions = Object.keys(IpcKeyType).map((type) => {
		return {
			label: type,
			value: type
		};
	});

	const model = writable({
		name: '',
		type: IpcKeyType.String
	} as SaveIpcNewKeyPayload);
	const rules = writable({
		name: [{ required: true }],
		type: [{ required: true }]
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
				const result = cloneDeep(get(model));

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
	class="tauri-redis-dialog tauri-redis-dialog__new-key"
	bind:header={$translations['create new key']}
	still
	on:close={handleDialogClose}
>
	<div class="tauri-redis-new-key">
		<Form class="new-key-form" {model} {rules} bind:this={formIns}>
			<FormItem bind:label={$translations['key name']} required prop="name"><Input bind:value={$model.name} /></FormItem
			>
			<FormItem bind:label={$translations['key type']} required prop="type">
				<Select bind:value={$model.type} options={selectOptions} searchable />
			</FormItem>
			<svelte:fragment slot="footer">
				<Button type="primary" on:click={handleTriggerCreate}>{$translations['create']}</Button>
				<Button on:click={handleTriggerCancel}>{$translations['cancel']}</Button>
			</svelte:fragment>
		</Form>
	</div>
</Dialog>
