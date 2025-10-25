import type { PageLoad } from './$types';

/**
 * Load function for tasks page
 * This runs before the page component is rendered
 */
export const load: PageLoad = async () => {
  // Return empty object - data loading is handled in the component
  // using onMount to ensure stores are properly initialized
  return {};
};
