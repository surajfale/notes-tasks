import { writable, get } from 'svelte/store';
import { apiClient as api } from '$lib/api';
import type { Link, CreateLinkData, UpdateLinkData, LinkFilters } from '$lib/types/link';

interface LinksState {
    items: Link[];
    isLoading: boolean;
    error: string | null;
}

function createLinksStore() {
    const { subscribe, set, update } = writable<LinksState>({
        items: [],
        isLoading: false,
        error: null
    });

    return {
        subscribe,

        async loadAll(filters: LinkFilters = {}) {
            update(state => ({ ...state, isLoading: true, error: null }));
            try {
                const queryParams = new URLSearchParams();
                if (filters.listId) queryParams.append('listId', filters.listId);
                if (filters.isArchived !== undefined) queryParams.append('isArchived', String(filters.isArchived));
                if (filters.tags && filters.tags.length > 0) queryParams.append('tags', filters.tags.join(','));
                if (filters.search) queryParams.append('search', filters.search);

                const links = await api.get<Link[]>(`/api/links?${queryParams.toString()}`);
                update(state => ({ ...state, items: links, isLoading: false }));
            } catch (error: any) {
                update(state => ({
                    ...state,
                    isLoading: false,
                    error: error.message || 'Failed to load links'
                }));
            }
        },

        async create(data: CreateLinkData) {
            update(state => ({ ...state, isLoading: true, error: null }));
            try {
                const newLink = await api.post<Link>('/api/links', data);
                update(state => ({
                    ...state,
                    items: [newLink, ...state.items],
                    isLoading: false
                }));
                return newLink;
            } catch (error: any) {
                update(state => ({
                    ...state,
                    isLoading: false,
                    error: error.message || 'Failed to create link'
                }));
                throw error;
            }
        },

        async update(id: string, data: UpdateLinkData) {
            // Optimistic update
            const previousState = get({ subscribe });
            update(state => ({
                ...state,
                items: state.items.map(link =>
                    link._id === id ? { ...link, ...data } : link
                )
            }));

            try {
                const updatedLink = await api.put<Link>(`/api/links/${id}`, data);
                // Update with actual server response
                update(state => ({
                    ...state,
                    items: state.items.map(link =>
                        link._id === id ? updatedLink : link
                    )
                }));
                return updatedLink;
            } catch (error: any) {
                // Revert on error
                set(previousState);
                update(state => ({
                    ...state,
                    error: error.message || 'Failed to update link'
                }));
                throw error;
            }
        },

        async delete(id: string) {
            // Optimistic update
            const previousState = get({ subscribe });
            update(state => ({
                ...state,
                items: state.items.filter(link => link._id !== id)
            }));

            try {
                await api.delete(`/api/links/${id}`);
            } catch (error: any) {
                // Revert on error
                set(previousState);
                update(state => ({
                    ...state,
                    error: error.message || 'Failed to delete link'
                }));
                throw error;
            }
        },

        reset() {
            set({
                items: [],
                isLoading: false,
                error: null
            });
        }
    };
}

export const linksStore = createLinksStore();
