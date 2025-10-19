import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/models/note.dart';
import '../data/notes_repository.dart';

part 'notes_provider.g.dart';

@riverpod
class Notes extends _$Notes {
  @override
  Future<List<Note>> build() async {
    return await loadNotes();
  }

  Future<List<Note>> loadNotes({String? search, List<String>? tags, bool? isArchived}) async {
    state = const AsyncValue.loading();
    try {
      final notes = await ref.read(notesRepositoryProvider).getNotes(
        search: search,
        tags: tags,
        isArchived: isArchived,
      );
      state = AsyncValue.data(notes);
      return notes;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> createNote({
    required String title,
    required String content,
    List<String>? tags,
  }) async {
    try {
      await ref.read(notesRepositoryProvider).createNote(
        title: title,
        content: content,
        tags: tags,
      );
      await loadNotes();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateNote({
    required String id,
    String? title,
    String? content,
    List<String>? tags,
    bool? isArchived,
  }) async {
    try {
      await ref.read(notesRepositoryProvider).updateNote(
        id: id,
        title: title,
        content: content,
        tags: tags,
        isArchived: isArchived,
      );
      await loadNotes();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteNote(String id) async {
    try {
      await ref.read(notesRepositoryProvider).deleteNote(id);
      await loadNotes();
    } catch (e) {
      rethrow;
    }
  }
}
