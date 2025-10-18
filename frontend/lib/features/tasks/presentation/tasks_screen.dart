import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/task.dart';
import '../providers/tasks_provider.dart';
import 'task_editor_screen.dart';
import 'package:intl/intl.dart';

class TasksScreen extends ConsumerWidget {
  const TasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(tasksProvider);

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

          return RefreshIndicator(
            onRefresh: () => ref.read(tasksProvider.notifier).loadTasks(),
            child: Column(
              children: [
                // Filter chips
                _FilterChips(ref: ref),
                const SizedBox(height: 8),
                // Tasks list
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: tasks.length,
                    itemBuilder: (context, index) {
                      final task = tasks[index];
                      return _TaskItem(task: task);
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (context) => const TaskEditorScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('New Task'),
      ),
    );
  }
}

class _FilterChips extends StatefulWidget {
  final WidgetRef ref;

  const _FilterChips({required this.ref});

  @override
  State<_FilterChips> createState() => _FilterChipsState();
}

class _FilterChipsState extends State<_FilterChips> {
  bool? _completedFilter;
  TaskPriority? _priorityFilter;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            FilterChip(
              label: const Text('All'),
              selected: _completedFilter == null,
              onSelected: (selected) {
                setState(() {
                  _completedFilter = null;
                });
                widget.ref.read(tasksProvider.notifier).loadTasks(
                      isCompleted: _completedFilter,
                      priority: _priorityFilter,
                    );
              },
            ),
            const SizedBox(width: 8),
            FilterChip(
              label: const Text('Completed'),
              selected: _completedFilter == true,
              onSelected: (selected) {
                setState(() {
                  _completedFilter = selected ? true : null;
                });
                widget.ref.read(tasksProvider.notifier).loadTasks(
                      isCompleted: _completedFilter,
                      priority: _priorityFilter,
                    );
              },
            ),
            const SizedBox(width: 8),
            FilterChip(
              label: const Text('Pending'),
              selected: _completedFilter == false,
              onSelected: (selected) {
                setState(() {
                  _completedFilter = selected ? false : null;
                });
                widget.ref.read(tasksProvider.notifier).loadTasks(
                      isCompleted: _completedFilter,
                      priority: _priorityFilter,
                    );
              },
            ),
            const SizedBox(width: 16),
            FilterChip(
              label: const Text('High Priority'),
              selected: _priorityFilter == TaskPriority.high,
              onSelected: (selected) {
                setState(() {
                  _priorityFilter = selected ? TaskPriority.high : null;
                });
                widget.ref.read(tasksProvider.notifier).loadTasks(
                      isCompleted: _completedFilter,
                      priority: _priorityFilter,
                    );
              },
            ),
            const SizedBox(width: 8),
            FilterChip(
              label: const Text('Medium Priority'),
              selected: _priorityFilter == TaskPriority.medium,
              onSelected: (selected) {
                setState(() {
                  _priorityFilter = selected ? TaskPriority.medium : null;
                });
                widget.ref.read(tasksProvider.notifier).loadTasks(
                      isCompleted: _completedFilter,
                      priority: _priorityFilter,
                    );
              },
            ),
            const SizedBox(width: 8),
            FilterChip(
              label: const Text('Low Priority'),
              selected: _priorityFilter == TaskPriority.low,
              onSelected: (selected) {
                setState(() {
                  _priorityFilter = selected ? TaskPriority.low : null;
                });
                widget.ref.read(tasksProvider.notifier).loadTasks(
                      isCompleted: _completedFilter,
                      priority: _priorityFilter,
                    );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _TaskItem extends ConsumerWidget {
  final Task task;

  const _TaskItem({required this.task});

  Color _getPriorityColor(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.high:
        return Colors.red;
      case TaskPriority.medium:
        return Colors.orange;
      case TaskPriority.low:
        return Colors.green;
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
  Widget build(BuildContext context, WidgetRef ref) {
    final isOverdue = task.dueDate != null &&
        task.dueDate!.isBefore(DateTime.now()) &&
        !task.isCompleted;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Checkbox(
                  value: task.isCompleted,
                  onChanged: (value) {
                    ref.read(tasksProvider.notifier).toggleComplete(task.id);
                  },
                ),
Expanded(
                  child: InkWell(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => TaskEditorScreen(task: task),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  task.title,
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        decoration: task.isCompleted
                                            ? TextDecoration.lineThrough
                                            : null,
                                        color: task.isCompleted
                                            ? Theme.of(context).colorScheme.outline
                                            : null,
                                      ),
                                ),
                              ),
                              Icon(
                                Icons.edit_outlined,
                                size: 16,
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                            ],
                          ),
                          if (task.description?.isNotEmpty == true) ...[
                            const SizedBox(height: 4),
                            Text(
                              task.description!,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    decoration: task.isCompleted
                                        ? TextDecoration.lineThrough
                                        : null,
                                  ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
Icon(
                  _getPriorityIcon(task.priority),
                  color: _getPriorityColor(task.priority),
                  size: 20,
                ),
                const SizedBox(width: 8),
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
                          builder: (context) => TaskEditorScreen(task: task),
                        ),
                      );
                    } else if (value == 'delete') {
                      final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Delete Task'),
                          content: Text('Are you sure you want to delete "${task.title}"?'),
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
                          await ref.read(tasksProvider.notifier).deleteTask(task.id);
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
            if (task.dueDate != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.schedule,
                    size: 16,
                    color: isOverdue
                        ? Colors.red
                        : Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Due: ${DateFormat('MMM dd, yyyy').format(task.dueDate!)}',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: isOverdue
                              ? Colors.red
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                  if (isOverdue) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.withOpacity(0.3)),
                      ),
                      child: Text(
                        'OVERDUE',
                        style: TextStyle(
                          color: Colors.red,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  'Priority: ${task.priority.name.toUpperCase()}',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: _getPriorityColor(task.priority),
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const Spacer(),
                Text(
                  'Updated ${DateFormat('MMM dd').format(task.updatedAt)}',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
