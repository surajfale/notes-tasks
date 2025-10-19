import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../../core/layout/app_scaffold.dart';
import '../../../core/models/note.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/notes_provider.dart';

class NoteEditorScreen extends ConsumerStatefulWidget {
  final Note? note;

  const NoteEditorScreen({super.key, this.note});

  @override
  ConsumerState<NoteEditorScreen> createState() => _NoteEditorScreenState();
}

class _NoteEditorScreenState extends ConsumerState<NoteEditorScreen> {
  late final TextEditingController _titleController;
  late final TextEditingController _contentController;
  late final TextEditingController _tagController;
  late List<String> _tags;
  bool _isSaving = false;
  bool _showPreview = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.note?.title ?? '');
    _contentController =
        TextEditingController(text: widget.note?.content ?? '');
    _tagController = TextEditingController();
    _tags = List<String>.from(widget.note?.tags ?? []);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
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

  void _insertMarkdown(String before, String after, {String placeholder = ''}) {
    final text = _contentController.text;
    final selection = _contentController.selection;
    final selectedText = selection.textInside(text);
    final newText = selectedText.isEmpty ? placeholder : selectedText;
    final replacement = '$before$newText$after';

    _contentController.value = TextEditingValue(
      text: text.replaceRange(selection.start, selection.end, replacement),
      selection: TextSelection.collapsed(
        offset: selection.start + before.length + newText.length,
      ),
    );
  }

  Future<void> _saveNote() async {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a title'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      if (widget.note == null) {
        await ref.read(notesProvider.notifier).createNote(
              title: _titleController.text.trim(),
              content: _contentController.text.trim(),
              tags: _tags.isEmpty ? null : _tags,
            );
      } else {
        await ref.read(notesProvider.notifier).updateNote(
              id: widget.note!.id,
              title: _titleController.text.trim(),
              content: _contentController.text.trim(),
              tags: _tags,
            );
      }

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text(widget.note == null ? 'Note created!' : 'Note updated!'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<void> _deleteNote() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.delete_forever, color: Colors.red),
            SizedBox(width: 12),
            Text('Delete Note'),
          ],
        ),
        content:
            Text('Are you sure you want to delete "${widget.note?.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && widget.note != null) {
      try {
        await ref.read(notesProvider.notifier).deleteNote(widget.note!.id);
        if (mounted) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Note deleted'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: widget.note == null ? 'New Note' : 'Edit Note',
      actions: [
        if (widget.note != null)
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Delete',
            onPressed: _deleteNote,
            color: Colors.red,
          ),
        const SizedBox(width: 8),
        FilledButton.icon(
          onPressed: _isSaving ? null : _saveNote,
          icon: _isSaving
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              : const Icon(Icons.check, size: 20),
          label: const Text('Save'),
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          ),
        ),
      ],
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isMobile = constraints.maxWidth < 600;
          return SingleChildScrollView(
            child: Padding(
              padding: EdgeInsets.all(isMobile ? 16.0 : 24.0),
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 900),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Title field
                      TextField(
                        controller: _titleController,
                        autofocus: widget.note == null,
                        decoration: InputDecoration(
                          hintText: 'Note title',
                          hintStyle: TextStyle(
                            color: Theme.of(context)
                                .colorScheme
                                .onSurfaceVariant
                                .withOpacity(0.5),
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          filled: true,
                          fillColor: Theme.of(context)
                              .colorScheme
                              .surfaceContainerHighest,
                          prefixIcon: Icon(
                            Icons.title,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 20),

                      // Tags section
                      _buildTagsSection(),
                      const SizedBox(height: 20),

                      // Formatting toolbar
                      _buildFormattingToolbar(),
                      const SizedBox(height: 16),

                      // Content editor / Preview
                      Container(
                        constraints: const BoxConstraints(minHeight: 400),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: Theme.of(context)
                                .colorScheme
                                .outline
                                .withOpacity(0.5),
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: _showPreview ? _buildPreview() : _buildEditor(),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTagsSection() {
    return Card(
      elevation: 0,
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.label,
                  size: 20,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Tags',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
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
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.w600,
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
                      const Text('Add Tag'),
                    ],
                  ),
                  onPressed: _showAddTagDialog,
                  backgroundColor:
                      Theme.of(context).colorScheme.secondaryContainer,
                  labelStyle: TextStyle(
                    color: Theme.of(context).colorScheme.onSecondaryContainer,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormattingToolbar() {
    return Card(
      elevation: 0,
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _FormatButton(
                icon: Icons.format_bold,
                label: 'Bold',
                onPressed: () =>
                    _insertMarkdown('**', '**', placeholder: 'bold'),
              ),
              _FormatButton(
                icon: Icons.format_italic,
                label: 'Italic',
                onPressed: () =>
                    _insertMarkdown('*', '*', placeholder: 'italic'),
              ),
              _FormatButton(
                icon: Icons.format_strikethrough,
                label: 'Strike',
                onPressed: () =>
                    _insertMarkdown('~~', '~~', placeholder: 'strikethrough'),
              ),
              const VerticalDivider(width: 20),
              _FormatButton(
                icon: Icons.title,
                label: 'H1',
                onPressed: () =>
                    _insertMarkdown('# ', '', placeholder: 'Heading 1'),
              ),
              _FormatButton(
                icon: Icons.title,
                label: 'H2',
                onPressed: () =>
                    _insertMarkdown('## ', '', placeholder: 'Heading 2'),
              ),
              _FormatButton(
                icon: Icons.title,
                label: 'H3',
                onPressed: () =>
                    _insertMarkdown('### ', '', placeholder: 'Heading 3'),
              ),
              const VerticalDivider(width: 20),
              _FormatButton(
                icon: Icons.format_list_bulleted,
                label: 'List',
                onPressed: () =>
                    _insertMarkdown('- ', '', placeholder: 'List item'),
              ),
              _FormatButton(
                icon: Icons.format_list_numbered,
                label: 'Numbers',
                onPressed: () =>
                    _insertMarkdown('1. ', '', placeholder: 'Numbered item'),
              ),
              _FormatButton(
                icon: Icons.check_box,
                label: 'Checkbox',
                onPressed: () =>
                    _insertMarkdown('- [ ] ', '', placeholder: 'Task'),
              ),
              const VerticalDivider(width: 20),
              _FormatButton(
                icon: Icons.code,
                label: 'Code',
                onPressed: () => _insertMarkdown('`', '`', placeholder: 'code'),
              ),
              _FormatButton(
                icon: Icons.link,
                label: 'Link',
                onPressed: () =>
                    _insertMarkdown('[', '](url)', placeholder: 'link text'),
              ),
              const VerticalDivider(width: 20),
              _FormatButton(
                icon: _showPreview ? Icons.edit : Icons.visibility,
                label: _showPreview ? 'Edit' : 'Preview',
                onPressed: () {
                  setState(() {
                    _showPreview = !_showPreview;
                  });
                },
                isActive: _showPreview,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEditor() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: TextField(
        controller: _contentController,
        decoration: InputDecoration(
          hintText:
              '# Start writing your note...\n\nUse markdown formatting:\n- **bold**\n- *italic*\n- # Headings\n- Lists, links, and more!',
          hintStyle: TextStyle(
            color:
                Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.4),
            height: 1.6,
          ),
          border: InputBorder.none,
          contentPadding: EdgeInsets.zero,
        ),
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              height: 1.6,
              fontSize: 16,
              fontFamily: 'monospace',
            ),
        maxLines: null,
        minLines: 15,
        textAlignVertical: TextAlignVertical.top,
      ),
    );
  }

  Widget _buildPreview() {
    if (_contentController.text.trim().isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.visibility_off,
                size: 64,
                color: Theme.of(context).colorScheme.outline,
              ),
              const SizedBox(height: 16),
              Text(
                'Nothing to preview',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Start writing to see the preview',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      child: SingleChildScrollView(
        child: Markdown(
          data: _contentController.text,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          styleSheet: MarkdownStyleSheet(
            h1: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
            h2: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
            h3: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
            p: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  height: 1.6,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
            code: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontFamily: 'monospace',
                  backgroundColor:
                      Theme.of(context).colorScheme.surfaceContainerHighest,
                  color: Theme.of(context).colorScheme.primary,
                ),
            listBullet: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                ),
          ),
        ),
      ),
    );
  }

  void _showAddTagDialog() {
    final allNotes = ref.read(notesProvider).value ?? [];

    // Get all existing tags from all notes
    final Set<String> existingTags = {};
    for (final note in allNotes) {
      existingTags.addAll(note.tags);
    }

    // Filter out tags that are already added to this note
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

class _FormatButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  final bool isActive;

  const _FormatButton({
    required this.icon,
    required this.label,
    required this.onPressed,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Tooltip(
        message: label,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isActive
                  ? Theme.of(context).colorScheme.primaryContainer
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              size: 20,
              color: isActive
                  ? Theme.of(context).colorScheme.onPrimaryContainer
                  : Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }
}
