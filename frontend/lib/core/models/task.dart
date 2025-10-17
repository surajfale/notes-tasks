import 'package:freezed_annotation/freezed_annotation.dart';

part 'task.freezed.dart';
part 'task.g.dart';

enum TaskPriority {
  @JsonValue('low')
  low,
  @JsonValue('medium')
  medium,
  @JsonValue('high')
  high,
}

@freezed
class Task with _$Task {
  const factory Task({
    @JsonKey(name: '_id') required String id,
    required String userId,
    required String title,
    String? description,
    @Default(false) bool isCompleted,
    @Default(TaskPriority.medium) TaskPriority priority,
    DateTime? dueDate,
    String? listId,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Task;

  factory Task.fromJson(Map<String, dynamic> json) => _$TaskFromJson(json);
}
