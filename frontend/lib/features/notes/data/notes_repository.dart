import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/dio_provider.dart';
import '../../../core/models/note.dart';

final notesRepositoryProvider = Provider<NotesRepository>((ref) {
  return NotesRepository(ref.watch(dioProvider));
});

class NotesRepository {
  final Dio _dio;

  NotesRepository(this._dio);

  Future<List<Note>> getNotes({
    String? search,
    List<String>? tags,
    bool? isArchived,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (search != null) queryParams['search'] = search;
      if (tags != null && tags.isNotEmpty) queryParams['tags'] = tags.join(',');
      if (isArchived != null) queryParams['isArchived'] = isArchived;

      final response = await _dio.get('/notes', queryParameters: queryParams);
      final List<dynamic> data = response.data['notes'] ?? response.data;
      return data.map((json) => Note.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Note> createNote({
    required String title,
    required String content,
    List<String>? tags,
    String? listId,
  }) async {
    try {
      final response = await _dio.post('/notes', data: {
        'title': title,
        'body': content,
        if (tags != null) 'tags': tags,
        if (listId != null) 'listId': listId,
      });
      return Note.fromJson(response.data['note'] ?? response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Note> updateNote({
    required String id,
    String? title,
    String? content,
    List<String>? tags,
    bool? isArchived,
  }) async {
    try {
      final response = await _dio.put('/notes/$id', data: {
        if (title != null) 'title': title,
        if (content != null) 'body': content,
        if (tags != null) 'tags': tags,
        if (isArchived != null) 'isArchived': isArchived,
      });
      return Note.fromJson(response.data['note'] ?? response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteNote(String id) async {
    try {
      await _dio.delete('/notes/$id');
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
