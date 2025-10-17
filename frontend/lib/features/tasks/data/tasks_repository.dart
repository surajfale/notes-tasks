import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/dio_provider.dart';
import '../../../core/models/task.dart';

final tasksRepositoryProvider = Provider<TasksRepository>((ref) {
  return TasksRepository(ref.watch(dioProvider));
});

class TasksRepository {
  final Dio _dio;

  TasksRepository(this._dio);

  Future<List<Task>> getTasks({
    bool? isCompleted,
    TaskPriority? priority,
    String? listId,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (isCompleted != null) queryParams['isCompleted'] = isCompleted;
      if (priority != null) queryParams['priority'] = priority.name;
      if (listId != null) queryParams['listId'] = listId;

      final response = await _dio.get('/tasks', queryParameters: queryParams);
      final List<dynamic> data = response.data['tasks'] ?? response.data;
      return data.map((json) => Task.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Task> createTask({
    required String title,
    String? description,
    TaskPriority? priority,
    DateTime? dueDate,
    String? listId,
  }) async {
    try {
      final response = await _dio.post('/tasks', data: {
        'title': title,
        if (description != null) 'description': description,
        if (priority != null) 'priority': priority.name,
        if (dueDate != null) 'dueDate': dueDate.toIso8601String(),
        if (listId != null) 'listId': listId,
      });
      return Task.fromJson(response.data['task'] ?? response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Task> updateTask({
    required String id,
    String? title,
    String? description,
    bool? isCompleted,
    TaskPriority? priority,
    DateTime? dueDate,
  }) async {
    try {
      final response = await _dio.put('/tasks/$id', data: {
        if (title != null) 'title': title,
        if (description != null) 'description': description,
        if (isCompleted != null) 'isCompleted': isCompleted,
        if (priority != null) 'priority': priority.name,
        if (dueDate != null) 'dueDate': dueDate.toIso8601String(),
      });
      return Task.fromJson(response.data['task'] ?? response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteTask(String id) async {
    try {
      await _dio.delete('/tasks/$id');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException e) {
    if (e.response != null) {
      final data = e.response!.data;
      if (data is Map && data.containsKey('error')) {
        return data['error']['message'] ?? 'An error occurred';
      }
    }
    return 'Network error. Please try again.';
  }
}
