import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/layout/app_scaffold.dart';
import '../../../core/models/task.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/tasks_provider.dart';
import 'package:intl/intl.dart';

class TaskEditorScreen extends ConsumerStatefulWidget {
  final Task? task;

  const TaskEditorScreen({super.key, this.task});

  @override
  ConsumerState<TaskEditorScreen> createState() => _TaskEditorScreenState();
}

class _TaskEditorScreenState extends ConsumerState<TaskEditorScreen> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _tagController;
  TaskPriority _priority = TaskPriority.medium;
  DateTime? _dueDate;
  bool _isCompleted = false;
  bool _isLoading = false;
  late List<String> _tags;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.task?.title ?? '');
    _descriptionController =
        TextEditingController(text: widget.task?.description ?? '');
    _tagController = TextEditingController();
    _priority = widget.task?.priority ?? TaskPriority.medium;
    _dueDate = widget.task?.dueDate;
    _isCompleted = widget.task?.isCompleted ?? false;
    _tags = List<String>.from(widget.task?.tags ?? []);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _tagController.dispose();
    super.dispose();
  }

  void _addTag() {
    final tag = _tagController.text.trim().toLowerCase();
    if (tag.isNotEmpty && !_tags.contains(tag)) {
      setState(() {
        _tags.add(tag);
        _tagController.clear();
      });
    }
  }

  void _removeTag(String tag) {
    setState(() {
      _tags.remove(tag);
    });
  }

  Future<void> _saveTask() async {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a task title')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (widget.task == null) {
        // Create new task
        await ref.read(tasksProvider.notifier).createTask(
              title: _titleController.text.trim(),
              description: _descriptionController.text.trim().isNotEmpty
                  ? _descriptionController.text.trim()
                  : null,
              dueDate: _dueDate,
              priority: _priority,
              tags: _tags.isEmpty ? null : _tags,
            );
      } else {
        // Update existing task
        await ref.read(tasksProvider.notifier).updateTask(
              id: widget.task!.id,
              title: _titleController.text.trim(),
              description: _descriptionController.text.trim().isNotEmpty
                  ? _descriptionController.text.trim()
                  : null,
              dueDate: _dueDate,
              priority: _priority,
              isCompleted: _isCompleted,
              tags: _tags,
            );
      }

      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving task: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _deleteTask() async {
    if (widget.task == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Task'),
        content: const Text('Are you sure you want to delete this task?'),
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
      setState(() => _isLoading = true);
      try {
        await ref.read(tasksProvider.notifier).deleteTask(widget.task!.id);
        if (mounted) {
          Navigator.of(context).pop();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting task: $e')),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    }
  }

  Future<void> _selectDueDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
    );

    if (date != null) {
      setState(() => _dueDate = date);
    }
  }

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
  Widget build(BuildContext context) {
    return AppScaffold(
      title: widget.task == null ? 'New Task' : 'Edit Task',
      actions: [
        if (widget.task != null)
          IconButton(
            onPressed: _isLoading ? null : _deleteTask,
            icon: const Icon(Icons.delete),
            color: Colors.red,
          ),
      ],
      child: LayoutBuilder(
        builder: (context, constraints) {
          // Responsive padding based on screen width
          final padding = constraints.maxWidth < 600 ? 12.0 : 16.0;
          return SingleChildScrollView(
            padding: EdgeInsets.all(padding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title field
                TextField(
                  controller: _titleController,
                  decoration: const InputDecoration(
                    labelText: 'Task Title',
                    hintText: 'Enter task title...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 1,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 16),

                // Description field
                TextField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Description (Optional)',
                    hintText: 'Enter task description...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                  textInputAction: TextInputAction.newline,
                ),
                const SizedBox(height: 24),

                // Priority selector
                Text(
                  'Priority',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: TaskPriority.values.map((priority) {
                    final isSelected = _priority == priority;
                    return ChoiceChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _getPriorityIcon(priority),
                            size: 18,
                            color: isSelected
                                ? Colors.white
                                : _getPriorityColor(priority),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            priority.name.toUpperCase(),
                            style: TextStyle(
                              color: isSelected
                                  ? Colors.white
                                  : _getPriorityColor(priority),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) {
                          setState(() => _priority = priority);
                        }
                      },
                      selectedColor: _getPriorityColor(priority),
                      backgroundColor:
                          _getPriorityColor(priority).withOpacity(0.1),
                      side: BorderSide(
                        color: _getPriorityColor(priority),
                        width: isSelected ? 0 : 1,
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // Tags section
                Text(
                  'Tags',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ..._tags.map((tag) => Chip(
                          label: Text(tag),
                          onDeleted: () => _removeTag(tag),
                          backgroundColor:
                              Theme.of(context).colorScheme.primaryContainer,
                          labelStyle: TextStyle(
                            color: Theme.of(context)
                                .colorScheme
                                .onPrimaryContainer,
                            fontWeight: FontWeight.w500,
                          ),
                          deleteIconColor:
                              Theme.of(context).colorScheme.onPrimaryContainer,
                        )),
                    ActionChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.add,
                            size: 18,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Add Tag',
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      onPressed: () => _showAddTagDialog(),
                      backgroundColor: Theme.of(context)
                          .colorScheme
                          .primaryContainer
                          .withOpacity(0.1),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Due date selector
                Text(
                  'Due Date',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.calendar_today),
                    title: Text(_dueDate == null
                        ? 'No due date'
                        : DateFormat('EEEE, MMMM dd, yyyy').format(_dueDate!)),
                    trailing: _dueDate == null
                        ? const Icon(Icons.add)
                        : IconButton(
                            onPressed: () => setState(() => _dueDate = null),
                            icon: const Icon(Icons.clear),
                          ),
                    onTap: _selectDueDate,
                  ),
                ),

                // Completion status (only for editing)
                if (widget.task != null) ...[
                  const SizedBox(height: 24),
                  Card(
                    child: SwitchListTile(
                      title: const Text('Mark as completed'),
                      value: _isCompleted,
                      onChanged: (value) =>
                          setState(() => _isCompleted = value),
                      secondary: Icon(
                        _isCompleted
                            ? Icons.check_circle
                            : Icons.radio_button_unchecked,
                        color: _isCompleted ? Colors.green : null,
                      ),
                    ),
                  ),
                ],

                const SizedBox(height: 32),

                // Save button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _saveTask,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(
                            widget.task == null ? 'Create Task' : 'Update Task',
                            style: const TextStyle(fontSize: 16),
                          ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showAddTagDialog() {
    final allTasks = ref.read(tasksProvider).value ?? [];

    // Get all existing tags from all tasks
    final Set<String> existingTags = {};
    for (final task in allTasks) {
      existingTags.addAll(task.tags);
    }

    // Filter out tags that are already added to this task
    final availableTags =
        existingTags.where((tag) => !_tags.contains(tag)).toList()..sort();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          final filterText = _tagController.text.toLowerCase();
          final suggestedTags = availableTags
              .where((tag) => tag.toLowerCase().contains(filterText))
              .take(5)
              .toList();

          return AlertDialog(
            title: const Text('Add Tag'),
            content: SizedBox(
              width: double.maxFinite,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: _tagController,
                    decoration: const InputDecoration(
                      hintText: 'Enter tag name',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.label),
                    ),
                    textCapitalization: TextCapitalization.none,
                    autofocus: true,
                    onChanged: (_) => setState(() {}),
                    onSubmitted: (_) {
                      _addTag();
                      Navigator.pop(context);
                    },
                  ),
                  if (suggestedTags.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(
                      'Suggested Tags',
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: suggestedTags.map((tag) {
                        final color = AppTheme.getTagColor(tag);
                        return InkWell(
                          onTap: () {
                            _tagController.text = tag;
                            _addTag();
                            Navigator.pop(context);
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: color.withOpacity(0.3),
                              ),
                            ),
                            child: Text(
                              tag,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    color: color,
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () {
                  _addTag();
                  Navigator.pop(context);
                },
                child: const Text('Add'),
              ),
            ],
          );
        },
      ),
    );
  }
}
