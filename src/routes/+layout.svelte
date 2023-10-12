<script lang="ts">
	import '$lib/sass/main.scss';
	import { createThemeMisc } from '$lib/utils/appearance';
	import { PageTheme } from '$lib/types';
	import Aside from './Aside.svelte';
	import { settings, Theme } from 'tauri-redis-plugin-setting-api';

	const themeMisc = createThemeMisc();
	themeMisc.initEvents();
	themeMisc.subscribe(function (theme) {
		Object.values(PageTheme).forEach(function (th) {
			document.documentElement.classList.remove(`theme-${th.toLowerCase()}`);
		});

		document.documentElement.classList.add(`theme-${theme.toLowerCase()}`);
	});

	settings.getTheme().then((theme) => {
		switch (theme) {
			case Theme.Dark: {
				themeMisc.useDarkTheme();
				break;
			}
			case Theme.Light: {
				themeMisc.useLightTheme();
				break;
			}
			case Theme.System: {
				themeMisc.useSystemTheme();
			}
		}
	});
</script>

<main class="tauri-redis-main">
	<Aside class="tauri-redis-aside" />
	<section class="tauri-redis-content">
		<slot />
	</section>
</main>
