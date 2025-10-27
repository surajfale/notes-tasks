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
					500: '#f44336',
					600: '#e53935',
				},
			},
		},
	},
	plugins: [],
	darkMode: 'class',
};
