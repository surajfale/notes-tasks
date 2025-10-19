import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/models/task.dart';
import '../data/tasks_repository.dart';

part 'tasks_provider.g.dart';

@riverpod
class Tasks extends _$Tasks {
  @override
  Future<List<Task>> build() async {
    return await loadTasks();
  }

  Future<List<Task>> loadTasks({bool? isCompleted, TaskPriority? priority, String? listId}) async {
    state = const AsyncValue.loading();
    try {
      final tasks = await ref.read(tasksRepositoryProvider).getTasks(
        isCompleted: isCompleted,
        priority: priority,
        listId: listId,
      );
      state = AsyncValue.data(tasks);
      return tasks;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> createTask({
    required String title,
    String? description,
    TaskPriority? priority,
    DateTime? dueDate,
    String? listId,
    List<String>? tags,
  }) async {
    try {
      await ref.read(tasksRepositoryProvider).createTask(
        title: title,
        description: description,
        priority: priority,
        dueDate: dueDate,
        listId: listId,
        tags: tags,
      );
      await loadTasks();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateTask({
    required String id,
    String? title,
    String? description,
    bool? isCompleted,
    TaskPriority? priority,
    DateTime? dueDate,
    List<String>? tags,
  }) async {
    try {
      await ref.read(tasksRepositoryProvider).updateTask(
        id: id,
        title: title,
        description: description,
        isCompleted: isCompleted,
        priority: priority,
        dueDate: dueDate,
        tags: tags,
      );
      await loadTasks();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> toggleTaskCompletion(Task task) async {
    await updateTask(
      id: task.id,
      isCompleted: !task.isCompleted,
    );
  }

  Future<void> toggleComplete(String id) async {
    try {
      await ref.read(tasksRepositoryProvider).toggleComplete(id);
      await loadTasks();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteTask(String id) async {
    try {
      await ref.read(tasksRepositoryProvider).deleteTask(id);
      await loadTasks();
    } catch (e) {
      rethrow;
    }
  }
}
