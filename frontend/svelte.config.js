import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			// Enable precompression for better performance
			precompress: true,
			strict: true
		}),
		// Enable preloading for better navigation performance
		prerender: {
			handleHttpError: 'warn'
		}
	}
};

export default config;
