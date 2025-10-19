import 'package:freezed_annotation/freezed_annotation.dart';

part 'note.freezed.dart';
part 'note.g.dart';

@freezed
class Note with _$Note {
  const Note._();
  
  const factory Note({
    @JsonKey(name: '_id') required String id,
    String? userId,
    required String title,
    @JsonKey(name: 'body') required String content,
    @Default([]) List<String> tags,
    String? listId,
    @Default(false) bool isArchived,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Note;

  factory Note.fromJson(Map<String, dynamic> json) => _$NoteFromJson(json);
}
