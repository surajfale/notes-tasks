// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'task.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TaskImpl _$$TaskImplFromJson(Map<String, dynamic> json) => _$TaskImpl(
      id: json['_id'] as String,
      userId: json['userId'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      isCompleted: json['isCompleted'] as bool? ?? false,
      priority: $enumDecodeNullable(_$TaskPriorityEnumMap, json['priority']) ??
          TaskPriority.medium,
      dueDate: json['dueAt'] == null
          ? null
          : DateTime.parse(json['dueAt'] as String),
      listId: json['listId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$$TaskImplToJson(_$TaskImpl instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'userId': instance.userId,
      'title': instance.title,
      'description': instance.description,
      'isCompleted': instance.isCompleted,
      'priority': _$TaskPriorityEnumMap[instance.priority]!,
      'dueAt': instance.dueDate?.toIso8601String(),
      'listId': instance.listId,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

const _$TaskPriorityEnumMap = {
  TaskPriority.low: 1,
  TaskPriority.medium: 2,
  TaskPriority.high: 3,
};
