import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/note.dart';
import '../data/notes_repository.dart';

final notesProvider = StateNotifierProvider<NotesNotifier, AsyncValue<List<Note>>>((ref) {
  return NotesNotifier(ref.watch(notesRepositoryProvider));
});

class NotesNotifier extends StateNotifier<AsyncValue<List<Note>>> {
  final NotesRepository _repository;

  NotesNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadNotes();
  }

  Future<void> loadNotes({String? search, List<String>? tags, bool? isArchived}) async {
    state = const AsyncValue.loading();
    try {
      final notes = await _repository.getNotes(
        search: search,
        tags: tags,
        isArchived: isArchived,
      );
      state = AsyncValue.data(notes);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> createNote({
    required String title,
    required String content,
    List<String>? tags,
  }) async {
    try {
      await _repository.createNote(
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
      await _repository.updateNote(
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
      await _repository.deleteNote(id);
      await loadNotes();
    } catch (e) {
      rethrow;
    }
  }
}
