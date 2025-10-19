import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/models/task.dart';
import '../providers/tasks_provider.dart';
import 'task_editor_screen.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import 'widgets/task_card.dart';

part 'tasks_screen.g.dart';

@riverpod
class SelectedTaskTags extends _$SelectedTaskTags {
  @override
  List<String> build() => [];

  void update(List<String> value) => state = value;
}

@riverpod
class SelectedTaskPriority extends _$SelectedTaskPriority {
  @override
  TaskPriority? build() => null;

  void update(TaskPriority? value) => state = value;
}

class TasksScreenContent extends ConsumerWidget {
  const TasksScreenContent({super.key});

  Set<String> _getAllTags(List<Task> tasks) {
    final tags = <String>{};
    for (final task in tasks) {
      tags.addAll(task.tags);
    }
    return tags;
  }

  List<Task> _filterTasks(List<Task> tasks, List<String> selectedTags, TaskPriority? selectedPriority) {
    return tasks.where((task) {
      // Tag filter
      final matchesTags = selectedTags.isEmpty || selectedTags.every((tag) => task.tags.contains(tag));

      // Priority filter
      final matchesPriority = selectedPriority == null || task.priority == selectedPriority;

      return matchesTags && matchesPriority;
    }).toList();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(tasksProvider);
    final selectedTags = ref.watch(selectedTaskTagsProvider);
    final selectedPriority = ref.watch(selectedTaskPriorityProvider);

    return tasksAsync.when(
        data: (tasks) {
          if (tasks.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.task_outlined,
                    size: 80,
                    color: Theme.of(context).colorScheme.outline,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No tasks yet',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap + to create your first task',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                ],
              ),
            );
          }

          final filteredTasks = _filterTasks(tasks, selectedTags, selectedPriority);
          final allTags = _getAllTags(tasks);

          return RefreshIndicator(
            onRefresh: () => ref.read(tasksProvider.notifier).loadTasks(),
            child: Column(
              children: [
                // Filter chips
                const _FilterChips(),
                // Tag filters
                if (allTags.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    height: 50,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: allTags.length,
                      itemBuilder: (context, index) {
                        final tag = allTags.elementAt(index);
                        final isSelected = selectedTags.contains(tag);
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: Text(tag),
                            selected: isSelected,
                            onSelected: (selected) {
                              if (selected) {
                                ref.read(selectedTaskTagsProvider.notifier).update([
                                  ...selectedTags,
                                  tag
                                ]);
                              } else {
                                ref.read(selectedTaskTagsProvider.notifier).update(
                                    selectedTags.where((t) => t != tag).toList());
                              }
                            },
                            backgroundColor: AppTheme.getTagColor(tag).withOpacity(0.1),
                            selectedColor: AppTheme.getTagColor(tag).withOpacity(0.2),
                            checkmarkColor: AppTheme.getTagColor(tag),
                            side: BorderSide(
                              color: isSelected
                                  ? AppTheme.getTagColor(tag)
                                  : AppTheme.getTagColor(tag).withOpacity(0.3),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                // Tasks list
                Expanded(
                  child: filteredTasks.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.search_off,
                                size: 64,
                                color: Theme.of(context).colorScheme.outline,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No matching tasks',
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    ),
                              ),
                            ],
                          ),
                        )
                      : LayoutBuilder(
                          builder: (context, constraints) {
                            // Responsive grid layout like notes
                            int crossAxisCount;
                            double childAspectRatio;
                            double padding;
                            double spacing;

                            if (constraints.maxWidth < 360) {
                              crossAxisCount = 1;
                              childAspectRatio = 2.2;
                              padding = 12;
                              spacing = 12;
                            } else if (constraints.maxWidth < 600) {
                              crossAxisCount = 1;
                              childAspectRatio = 2.5;
                              padding = 12;
                              spacing = 12;
                            } else if (constraints.maxWidth < 840) {
                              crossAxisCount = 2;
                              childAspectRatio = 2.2;
                              padding = 16;
                              spacing = 12;
                            } else if (constraints.maxWidth < 1200) {
                              crossAxisCount = 3;
                              childAspectRatio = 2.0;
                              padding = 16;
                              spacing = 12;
                            } else {
                              crossAxisCount = 4;
                              childAspectRatio = 2.0;
                              padding = 20;
                              spacing = 16;
                            }

                            return GridView.builder(
                              padding: EdgeInsets.all(padding),
                              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: crossAxisCount,
                                childAspectRatio: childAspectRatio,
                                crossAxisSpacing: spacing,
                                mainAxisSpacing: spacing,
                              ),
                              itemCount: filteredTasks.length,
                              itemBuilder: (context, index) {
                                final task = filteredTasks[index];
                                return TaskCard(task: task);
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: Theme.of(context).colorScheme.error),
              const SizedBox(height: 16),
              Text('Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.read(tasksProvider.notifier).loadTasks(),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
  }
}

class _FilterChips extends ConsumerWidget {
  const _FilterChips();

  Widget _buildModernChip(
    BuildContext context, {
    required String label,
    required bool selected,
    required VoidCallback onTap,
    Color? color,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          gradient: selected
              ? LinearGradient(
                  colors: color != null
                      ? [color, color.withOpacity(0.8)]
                      : [const Color(0xFF6366F1), const Color(0xFF8B5CF6)],
                )
              : null,
          color: selected ? null : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(12),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: (color ?? const Color(0xFF6366F1)).withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.grey.shade700,
            fontWeight: selected ? FontWeight.bold : FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedPriority = ref.watch(selectedTaskPriorityProvider);

    return LayoutBuilder(
      builder: (context, constraints) {
        // Responsive padding for filter chips
        final horizontalPadding = constraints.maxWidth < 600 ? 12.0 : 16.0;
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 12),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                const SizedBox(width: 16),
                _buildModernChip(
                  context,
                  label: '🔴 High',
                  selected: selectedPriority == TaskPriority.high,
                  onTap: () {
                    ref.read(selectedTaskPriorityProvider.notifier).state =
                        selectedPriority == TaskPriority.high ? null : TaskPriority.high;
                  },
                  color: const Color(0xFFEF4444),
                ),
                const SizedBox(width: 8),
                _buildModernChip(
                  context,
                  label: '🟠 Medium',
                  selected: selectedPriority == TaskPriority.medium,
                  onTap: () {
                    ref.read(selectedTaskPriorityProvider.notifier).state =
                        selectedPriority == TaskPriority.medium ? null : TaskPriority.medium;
                  },
                  color: const Color(0xFFF97316),
                ),
                const SizedBox(width: 8),
                _buildModernChip(
                  context,
                  label: '🟢 Low',
                  selected: selectedPriority == TaskPriority.low,
                  onTap: () {
                    ref.read(selectedTaskPriorityProvider.notifier).state =
                        selectedPriority == TaskPriority.low ? null : TaskPriority.low;
                  },
                  color: const Color(0xFF22C55E),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
