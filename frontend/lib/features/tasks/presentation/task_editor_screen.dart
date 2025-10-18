import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/task.dart';
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
  TaskPriority _priority = TaskPriority.medium;
  DateTime? _dueDate;
  bool _isCompleted = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.task?.title ?? '');
    _descriptionController = TextEditingController(text: widget.task?.description ?? '');
    _priority = widget.task?.priority ?? TaskPriority.medium;
    _dueDate = widget.task?.dueDate;
    _isCompleted = widget.task?.isCompleted ?? false;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
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
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.task == null ? 'New Task' : 'Edit Task'),
        actions: [
          if (widget.task != null)
            IconButton(
              onPressed: _isLoading ? null : _deleteTask,
              icon: const Icon(Icons.delete),
              color: Colors.red,
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
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
                  backgroundColor: _getPriorityColor(priority).withOpacity(0.1),
                  side: BorderSide(
                    color: _getPriorityColor(priority),
                    width: isSelected ? 0 : 1,
                  ),
                );
              }).toList(),
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
                  onChanged: (value) => setState(() => _isCompleted = value),
                  secondary: Icon(
                    _isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
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
      ),
    );
  }
}