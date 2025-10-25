import { notesRepository } from '$lib/repositories/notes.repository';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = async ({ params }) => {
  try {
    const note = await notesRepository.getById(params.id);
    return {
      note
    };
  } catch (err: any) {
    throw error(404, {
      message: 'Note not found'
    });
  }
};
