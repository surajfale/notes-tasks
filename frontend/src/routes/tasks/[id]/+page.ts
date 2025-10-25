import { tasksRepository } from '$lib/repositories/tasks.repository';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = async ({ params }) => {
  try {
    const task = await tasksRepository.getById(params.id);
    return {
      task
    };
  } catch (err: any) {
    throw error(404, {
      message: 'Task not found'
    });
  }
};
