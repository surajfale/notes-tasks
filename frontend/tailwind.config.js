/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./src/app.html'
	],
	// Enable JIT mode for faster builds and smaller CSS
	mode: 'jit',
	theme: {
		extend: {
			fontFamily: {
				// Persona-driven: app.css redefines --font-sans/--font-mono per
				// data-persona value. Fallback stack covers pre-hydration paint.
				sans: [
					'var(--font-sans)',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'Oxygen',
					'Ubuntu',
					'Cantarell',
					'Open Sans',
					'Helvetica Neue',
					'sans-serif'
				],
				mono: [
					'var(--font-mono)',
					'ui-monospace',
					'SFMono-Regular',
					'Menlo',
					'Consolas',
					'monospace'
				],
				serif: [
					'Lora',
					'Georgia',
					'Cambria',
					'Times New Roman',
					'Times',
					'serif'
				]
			},
			colors: {
				// Dynamic primary color using CSS custom properties
				primary: {
					50: 'rgb(var(--primary-50) / <alpha-value>)',
					100: 'rgb(var(--primary-100) / <alpha-value>)',
					200: 'rgb(var(--primary-200) / <alpha-value>)',
					300: 'rgb(var(--primary-300) / <alpha-value>)',
					400: 'rgb(var(--primary-400) / <alpha-value>)',
					500: 'rgb(var(--primary-500) / <alpha-value>)',
					600: 'rgb(var(--primary-600) / <alpha-value>)',
					700: 'rgb(var(--primary-700) / <alpha-value>)',
					800: 'rgb(var(--primary-800) / <alpha-value>)',
					900: 'rgb(var(--primary-900) / <alpha-value>)',
				},
				// Neutral scale, remapped per persona in app.css (data-persona
				// attribute). Values below are the "focus" persona's own scale,
				// duplicated as the :root default so nothing renders unstyled
				// before JS sets data-persona on first paint.
				stone: {
					50: 'rgb(var(--stone-50) / <alpha-value>)',
					100: 'rgb(var(--stone-100) / <alpha-value>)',
					200: 'rgb(var(--stone-200) / <alpha-value>)',
					300: 'rgb(var(--stone-300) / <alpha-value>)',
					400: 'rgb(var(--stone-400) / <alpha-value>)',
					500: 'rgb(var(--stone-500) / <alpha-value>)',
					600: 'rgb(var(--stone-600) / <alpha-value>)',
					700: 'rgb(var(--stone-700) / <alpha-value>)',
					800: 'rgb(var(--stone-800) / <alpha-value>)',
					900: 'rgb(var(--stone-900) / <alpha-value>)',
					950: 'rgb(var(--stone-950) / <alpha-value>)',
				},
				secondary: {
					50: '#fce4ec',
					100: '#f8bbd0',
					200: '#f48fb1',
					300: '#f06292',
					400: '#ec407a',
					500: '#e91e63',
					600: '#d81b60',
					700: '#c2185b',
					800: '#ad1457',
					900: '#880e4f',
				},
				surface: {
					light: '#ffffff',
					dark: '#1e1e1e',
				},
				background: {
					light: '#fafafa',
					dark: '#121212',
				},
				error: {
					50: '#ffebee',
					100: '#ffcdd2',
					200: '#ef9a9a',
					300: '#e57373',
					400: '#ef5350',
					500: '#f44336',
					600: '#e53935',
					700: '#d32f2f',
					800: '#c62828',
					900: '#b71c1c',
				},
			},
		},
	},
	plugins: [],
	darkMode: 'class',
};
