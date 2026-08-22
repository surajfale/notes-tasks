<script lang="ts">
	import { currentUser } from '$lib/stores/auth';
	import { PageHeader } from '$lib/components/ui';

	$: user = $currentUser;

	const shortcuts = [
		{
			href: '/notes',
			label: 'Notes',
			description: 'Create and organize your notes with tags and lists',
			path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
		},
		{
			href: '/tasks',
			label: 'Tasks',
			description: 'Manage your tasks with priorities and due dates',
			path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
		},
		{
			href: '/links',
			label: 'Links',
			description: 'Save and organize your favorite links',
			path: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
		},
		{
			href: '/lists',
			label: 'Lists',
			description: 'Organize your notes and tasks into custom lists',
			path: 'M4 6h16M4 10h16M4 14h16M4 18h16'
		}
	];
</script>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
	<PageHeader
		title="Welcome{user ? `, ${user.displayName}` : ''}"
		description="Your notes and tasks are ready to manage."
	/>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
		{#each shortcuts as item}
			<a
				href={item.href}
				class="group block p-5 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 transition-colors duration-150 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50/60 dark:hover:bg-stone-800/40"
			>
				<div
					class="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-3"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.path} />
					</svg>
				</div>
				<h2 class="text-base font-semibold text-stone-900 dark:text-stone-100">{item.label}</h2>
				<p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
					{item.description}
				</p>
			</a>
		{/each}
	</div>
</div>
