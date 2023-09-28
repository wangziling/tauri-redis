<script lang="ts">
	import '$lib/sass/main.scss';
	import { createThemeMisc } from '$lib/utils/appearance';
	import { PageTheme } from '$lib/types';
	import { translator } from 'tauri-redis-plugin-translation-api';
	import Aside from './Aside.svelte';

	const themeMisc = createThemeMisc();
	themeMisc.initEvents();
	themeMisc.subscribe(function (theme) {
		Object.values(PageTheme).forEach(function (th) {
			document.documentElement.classList.remove(`theme-${th.toLowerCase()}`);
		});

		document.documentElement.classList.add(`theme-${theme.toLowerCase()}`);
	});

	// Get resource.
	translator.switchTo('en-US');
</script>

<main class="tauri-redis-main">
	<Aside class="tauri-redis-aside" />
	<section class="tauri-redis-content">
		<slot />
	</section>
</main>
