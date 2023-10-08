<script lang="ts">
	import type { MainTab, MainTabType } from '$lib/types';
	import { calcDynamicClasses } from '$lib/utils/calculators';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import Input from '$lib/components/Input.svelte';
	import InputNumber from '$lib/components/InputNumber.svelte';
	import { IpcKeyType } from '$lib/types';

	export let data: Extract<MainTab, { type: MainTabType.KeyDetail }>['data'] = {} as any;

	let keyMetrics = {
		ttl: -1,
		type: IpcKeyType.String,
		content: null
	};

	const translations = translator.derived(function () {
		return {
			'key ttl': translator.translate('key ttl|TTL')
		};
	});

	$: dynamicClasses = calcDynamicClasses(['key-detail', $$restProps.class]);
</script>

<div class={dynamicClasses}>
	<div class="key-detail-wrapper">
		<div class="key-detail-header">
			<div class="key-detail-metrics">
				<Input bind:value={data.key}>
					<span slot="prefix">{keyMetrics.type}</span>
					<span slot="suffix" class="input__operation fa fa-check" />
				</Input>
				<InputNumber bind:value={keyMetrics.ttl} minimum={-1} maximum={65535} showStepOperations={false}>
					<span slot="prefix">{$translations['key ttl']}</span>
					<span slot="suffix" class="input__operation fa fa-check" />
				</InputNumber>
			</div>
		</div>
		<div class="key-detail-content">{keyMetrics.content}</div>
	</div>
</div>
