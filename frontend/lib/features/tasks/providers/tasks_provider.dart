import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/task.dart';
import '../data/tasks_repository.dart';

final tasksProvider = StateNotifierProvider<TasksNotifier, AsyncValue<List<Task>>>((ref) {
  return TasksNotifier(ref.watch(tasksRepositoryProvider));
});

class TasksNotifier extends StateNotifier<AsyncValue<List<Task>>> {
  final TasksRepository _repository;

  TasksNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadTasks();
  }

  Future<void> loadTasks({bool? isCompleted, TaskPriority? priority}) async {
    state = const AsyncValue.loading();
    try {
      final tasks = await _repository.getTasks(
        isCompleted: isCompleted,
        priority: priority,
      );
      state = AsyncValue.data(tasks);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> createTask({
    required String title,
    String? description,
    TaskPriority? priority,
    DateTime? dueDate,
  }) async {
    try {
      await _repository.createTask(
        title: title,
        description: description,
        priority: priority,
        dueDate: dueDate,
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
  }) async {
    try {
      await _repository.updateTask(
        id: id,
        title: title,
        description: description,
        isCompleted: isCompleted,
        priority: priority,
        dueDate: dueDate,
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

  Future<void> deleteTask(String id) async {
    try {
      await _repository.deleteTask(id);
      await loadTasks();
    } catch (e) {
      rethrow;
    }
  }
}
