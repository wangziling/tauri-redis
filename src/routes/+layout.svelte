<script lang="ts">
	import '$lib/sass/main.scss';
	import { createThemeMisc } from '$lib/utils/appearance';
	import { PageTheme } from '$lib/types';

	const themeMisc = createThemeMisc();
	themeMisc.initEvents();
	themeMisc.subscribe(function (theme) {
		Object.values(PageTheme).forEach(function (th) {
			document.documentElement.classList.remove(`theme-${th.toLowerCase()}`);
		});

		document.documentElement.classList.add(`theme-${theme.toLowerCase()}`);
	});
</script>

<main class="tauri-redis-main">
	<slot />
</main>
