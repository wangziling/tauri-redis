<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function handleBtnClick() {
		dispatch.apply(this, ['newConnection', ...arguments]);
	}
</script>

<aside class="tauri-redis-aside">
	<header class="tauri-redis-aside__header">
		<div class="tauri-redis-aside__header-wrapper">
			<Button
				class="tauri-redis-aside__operation-btn tauri-redis-aside__operations-new"
				type="primary"
				on:click={handleBtnClick}
			>
				<span>New connection</span>
				<span class="fa fa-plus" />
			</Button>
		</div>
	</header>
	<section class="tauri-redis-aside__content" />
</aside>
