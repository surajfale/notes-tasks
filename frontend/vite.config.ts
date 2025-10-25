import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		globals: true,
		environment: 'happy-dom',
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	server: {
		port: 5173
	},
	build: {
		// Enable code splitting and chunk optimization
		rollupOptions: {
			output: {
				// Manual chunk splitting for better caching
				manualChunks: (id) => {
					// Vendor chunks for better caching
					if (id.includes('node_modules')) {
						// Split idb into its own chunk
						if (id.includes('idb')) {
							return 'idb';
						}
						// Other vendor dependencies
						return 'vendor';
					}
					// Split stores into their own chunk
					if (id.includes('/lib/stores/')) {
						return 'stores';
					}
					// Split repositories into their own chunk
					if (id.includes('/lib/repositories/')) {
						return 'repositories';
					}
				},
				// Optimize chunk file names
				chunkFileNames: 'chunks/[name]-[hash].js',
				entryFileNames: 'entries/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash][extname]'
			}
		},
		// Optimize chunk size warnings
		chunkSizeWarningLimit: 600,
		// Enable minification with esbuild (faster than terser)
		minify: 'esbuild',
		// Enable source maps for production debugging (optional)
		sourcemap: false,
		// Target modern browsers for smaller bundle
		target: 'es2020'
	},
	// Optimize dependencies
	optimizeDeps: {
		include: ['idb'],
		exclude: []
	}
});
