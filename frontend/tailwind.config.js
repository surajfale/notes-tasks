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
				// Material Design 3 color palette
				primary: {
					50: '#e8f5e9',
					100: '#c8e6c9',
					200: '#a5d6a7',
					300: '#81c784',
					400: '#66bb6a',
					500: '#4caf50',
					600: '#43a047',
					700: '#388e3c',
					800: '#2e7d32',
					900: '#1b5e20',
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
