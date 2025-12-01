<script lang="ts">
	import { currentUser } from '$lib/stores/auth';
	
	$: user = $currentUser;
</script>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
	<h1 class="text-3xl sm:text-4xl font-bold text-primary-700 dark:text-primary-300">
		Welcome{#if user}, {user.displayName}{/if}!
	</h1>
	<p class="mt-3 sm:mt-4 text-base sm:text-lg text-gray-700 dark:text-gray-300">
		Your notes and tasks are ready to manage.
	</p>
	
	<div class="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
		
		<!-- Notes card -->
		<a 
			href="/notes"
			class="block p-5 sm:p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors min-h-[120px] sm:min-h-[140px]"
		>
			<div class="flex items-center space-x-3 mb-3">
				<svg class="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<h2 class="text-lg sm:text-xl font-semibold">Notes</h2>
			</div>
			<p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
				Create and organize your notes with tags and lists
			</p>
		</a>
		
		<!-- Tasks card -->
		<a 
			href="/tasks"
			class="block p-5 sm:p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors min-h-[120px] sm:min-h-[140px]"
		>
			<div class="flex items-center space-x-3 mb-3">
				<svg class="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
				</svg>
				<h2 class="text-lg sm:text-xl font-semibold">Tasks</h2>
			</div>
			<p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
				Manage your tasks with priorities and due dates
			</p>
		</a>

		<!-- Links card -->
		<a 
			href="/links"
			class="block p-5 sm:p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors min-h-[120px] sm:min-h-[140px]"
		>
			<div class="flex items-center space-x-3 mb-3">
				<svg class="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
				</svg>
				<h2 class="text-lg sm:text-xl font-semibold">Links</h2>
			</div>
			<p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
				Save and organize your favorite links
			</p>
		</a>
		
		<!-- Lists card -->
		<a 
			href="/lists"
			class="block p-5 sm:p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors min-h-[120px] sm:min-h-[140px]"
		>
			<div class="flex items-center space-x-3 mb-3">
				<svg class="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
				</svg>
				<h2 class="text-lg sm:text-xl font-semibold">Lists</h2>
			</div>
			<p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
				Organize your notes and tasks into custom lists
			</p>
		</a>
		
	</div>
</div>
