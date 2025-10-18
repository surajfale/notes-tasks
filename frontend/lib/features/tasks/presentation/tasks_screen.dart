import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/task.dart';
import '../providers/tasks_provider.dart';
import 'task_editor_screen.dart';
import 'package:intl/intl.dart';

final selectedTaskTagsProvider = StateProvider<List<String>>((ref) => []);
final selectedTaskPriorityProvider = StateProvider<TaskPriority?>((ref) => null);

class TasksScreen extends ConsumerWidget {
  const TasksScreen({super.key});

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

    return Scaffold(
      body: tasksAsync.when(
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
                                ref.read(selectedTaskTagsProvider.notifier).state = [
                                  ...selectedTags,
                                  tag
                                ];
                              } else {
                                ref.read(selectedTaskTagsProvider.notifier).state =
                                    selectedTags.where((t) => t != tag).toList();
                              }
                            },
                            backgroundColor:
                                Theme.of(context).colorScheme.surfaceContainerHighest,
                            selectedColor: Theme.of(context).colorScheme.primaryContainer,
                            checkmarkColor: Theme.of(context).colorScheme.primary,
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
                            // Responsive padding based on screen size
                            final padding = constraints.maxWidth < 600 ? 12.0 : 16.0;
                            return ListView.builder(
                              padding: EdgeInsets.all(padding),
                              itemCount: filteredTasks.length,
                              itemBuilder: (context, index) {
                                final task = filteredTasks[index];
                                return _TaskItem(task: task);
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
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF6366F1),
              Color(0xFF8B5CF6),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF6366F1).withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: FloatingActionButton.extended(
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const TaskEditorScreen()),
            );
          },
          backgroundColor: Colors.transparent,
          elevation: 0,
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text(
            'New Task',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
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

class _TaskItem extends ConsumerStatefulWidget {
  final Task task;

  const _TaskItem({required this.task});

  @override
  ConsumerState<_TaskItem> createState() => _TaskItemState();
}

class _TaskItemState extends ConsumerState<_TaskItem> {
  bool _isExpanded = false;

  LinearGradient _getPriorityGradient(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.high:
        return const LinearGradient(
          colors: [Color(0xFFEF4444), Color(0xFFF87171)],
        );
      case TaskPriority.medium:
        return const LinearGradient(
          colors: [Color(0xFFF97316), Color(0xFFFB923C)],
        );
      case TaskPriority.low:
        return const LinearGradient(
          colors: [Color(0xFF22C55E), Color(0xFF4ADE80)],
        );
    }
  }

  Color _getPriorityColor(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.high:
        return const Color(0xFFEF4444);
      case TaskPriority.medium:
        return const Color(0xFFF97316);
      case TaskPriority.low:
        return const Color(0xFF22C55E);
    }
  }

  IconData _getPriorityIcon(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.high:
        return Icons.keyboard_double_arrow_up;
      case TaskPriority.medium:
        return Icons.keyboard_arrow_up;
      case TaskPriority.low:
        return Icons.keyboard_arrow_down;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOverdue = widget.task.dueDate != null &&
        widget.task.dueDate!.isBefore(DateTime.now()) &&
        !widget.task.isCompleted;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: widget.task.isCompleted
              ? LinearGradient(
                  colors: [
                    Colors.grey.shade100,
                    Colors.grey.shade50,
                  ],
                )
              : null,
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      gradient: widget.task.isCompleted
                          ? const LinearGradient(
                              colors: [Color(0xFF10B981), Color(0xFF34D399)],
                            )
                          : null,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Checkbox(
                      value: widget.task.isCompleted,
                      onChanged: (value) {
                        ref.read(tasksProvider.notifier).toggleComplete(widget.task.id);
                      },
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ),
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        if (widget.task.description?.isNotEmpty == true) {
                          setState(() {
                            _isExpanded = !_isExpanded;
                          });
                        }
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.task.title,
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    decoration: widget.task.isCompleted
                                        ? TextDecoration.lineThrough
                                        : null,
                                    color: widget.task.isCompleted
                                        ? Theme.of(context).colorScheme.outline
                                        : null,
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            if (widget.task.description?.isNotEmpty == true) ...[
                              const SizedBox(height: 4),
                              AnimatedCrossFade(
                                firstChild: Text(
                                  widget.task.description!,
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                                        decoration: widget.task.isCompleted
                                            ? TextDecoration.lineThrough
                                            : null,
                                      ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                secondChild: Text(
                                  widget.task.description!,
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                                        decoration: widget.task.isCompleted
                                            ? TextDecoration.lineThrough
                                            : null,
                                      ),
                                ),
                                crossFadeState: _isExpanded
                                    ? CrossFadeState.showSecond
                                    : CrossFadeState.showFirst,
                                duration: const Duration(milliseconds: 200),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                  if (widget.task.description?.isNotEmpty == true)
                    IconButton(
                      icon: AnimatedRotation(
                        turns: _isExpanded ? 0.5 : 0,
                        duration: const Duration(milliseconds: 200),
                        child: const Icon(Icons.expand_more),
                      ),
                      onPressed: () {
                        setState(() {
                          _isExpanded = !_isExpanded;
                        });
                      },
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  IconButton(
                    icon: const Icon(Icons.edit_outlined, size: 20),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => TaskEditorScreen(task: widget.task),
                        ),
                      );
                    },
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      gradient: _getPriorityGradient(widget.task.priority),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: _getPriorityColor(widget.task.priority).withOpacity(0.3),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Icon(
                      _getPriorityIcon(widget.task.priority),
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert),
                  itemBuilder: (context) => [
                    PopupMenuItem<String>(
                      value: 'edit',
                      child: const ListTile(
                        leading: Icon(Icons.edit),
                        title: Text('Edit'),
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                    PopupMenuItem<String>(
                      value: 'delete',
                      child: const ListTile(
                        leading: Icon(Icons.delete, color: Colors.red),
                        title: Text('Delete', style: TextStyle(color: Colors.red)),
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ],
                  onSelected: (value) async {
                    if (value == 'edit') {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => TaskEditorScreen(task: widget.task),
                        ),
                      );
                    } else if (value == 'delete') {
                      final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Delete Task'),
                          content: Text('Are you sure you want to delete "${widget.task.title}"?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.of(context).pop(false),
                              child: const Text('Cancel'),
                            ),
                            TextButton(
                              onPressed: () => Navigator.of(context).pop(true),
                              style: TextButton.styleFrom(foregroundColor: Colors.red),
                              child: const Text('Delete'),
                            ),
                          ],
                        ),
                      );
                      
                      if (confirmed == true) {
                        try {
                          await ref.read(tasksProvider.notifier).deleteTask(widget.task.id);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Task deleted successfully')),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Error deleting task: $e')),
                            );
                          }
                        }
                      }
                    }
                    },
                  ),
                ],
              ),
              if (widget.task.dueDate != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isOverdue
                            ? Colors.red.withOpacity(0.1)
                            : Theme.of(context).colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(10),
                        border: isOverdue
                            ? Border.all(color: Colors.red.withOpacity(0.3))
                            : null,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.schedule,
                            size: 14,
                            color: isOverdue
                                ? Colors.red
                                : Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            DateFormat('MMM dd').format(widget.task.dueDate!),
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: isOverdue
                                      ? Colors.red
                                      : Theme.of(context).colorScheme.onSurfaceVariant,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ],
                      ),
                    ),
                    if (isOverdue) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFEF4444), Color(0xFFF87171)],
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'OVERDUE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                    const Spacer(),
                    Text(
                      DateFormat('MMM dd').format(widget.task.updatedAt),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                  ],
                ),
              ],
              if (widget.task.dueDate == null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Spacer(),
                    Text(
                      'Updated ${DateFormat('MMM dd').format(widget.task.updatedAt)}',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                  ],
                ),
              ],
              // Tags display
              if (widget.task.tags.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: widget.task.tags.map((tag) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.tag,
                            size: 12,
                            color: Theme.of(context).colorScheme.onPrimaryContainer,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            tag,
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
