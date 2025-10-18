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
      if (priority != null) queryParams['priority'] = _priorityToInt(priority);
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
    List<String>? tags,
  }) async {
    try {
      final requestData = <String, dynamic>{
        'title': title,
        if (description != null) 'description': description,
        if (priority != null) 'priority': _priorityToInt(priority),
        if (dueDate != null) 'dueAt': dueDate.toIso8601String(),
        if (listId != null) 'listId': listId,
        if (tags != null) 'tags': tags,
        'isCompleted': false, // Explicitly set default value
      };
      
      final response = await _dio.post('/tasks', data: requestData);
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
    List<String>? tags,
  }) async {
    try {
      final response = await _dio.put('/tasks/$id', data: {
        if (title != null) 'title': title,
        if (description != null) 'description': description,
        if (isCompleted != null) 'isCompleted': isCompleted,
        if (priority != null) 'priority': _priorityToInt(priority),
        if (dueDate != null) 'dueAt': dueDate.toIso8601String(),
        if (tags != null) 'tags': tags,
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

  Future<Task> toggleComplete(String id) async {
    try {
      final response = await _dio.put('/tasks/$id/complete');
      return Task.fromJson(response.data['task'] ?? response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }


  int _priorityToInt(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.low:
        return 1;
      case TaskPriority.medium:
        return 2;
      case TaskPriority.high:
        return 3;
    }
  }

  String _handleError(DioException e) {
    if (e.response != null) {
      final data = e.response!.data;
      if (data is Map && data.containsKey('error')) {
        return data['error']['message'] ?? 'An error occurred';
      }
      return 'Server error: ${e.response!.statusCode}';
    }
    if (e.type == DioExceptionType.connectionTimeout) {
      return 'Connection timeout. Please check your internet.';
    }
    if (e.type == DioExceptionType.receiveTimeout) {
      return 'Request timeout. Please try again.';
    }
    return 'Network error. Please try again.';
  }
}
