import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/note.dart';
import '../providers/notes_provider.dart';
import 'note_editor_screen.dart';
import 'package:intl/intl.dart';

class NotesScreen extends ConsumerWidget {
  const NotesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notesAsync = ref.watch(notesProvider);

    return Scaffold(
      body: notesAsync.when(
        data: (notes) {
          if (notes.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.note_outlined,
                    size: 80,
                    color: Theme.of(context).colorScheme.outline,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No notes yet',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap + to create your first note',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.read(notesProvider.notifier).loadNotes(),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final crossAxisCount = constraints.maxWidth > 1200
                    ? 4
                    : constraints.maxWidth > 800
                        ? 3
                        : constraints.maxWidth > 600
                            ? 2
                            : 1;
                
                return GridView.builder(
                  padding: const EdgeInsets.all(20),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    childAspectRatio: 0.85,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: notes.length,
                  itemBuilder: (context, index) {
                    final note = notes[index];
                    return _NoteCard(note: note, index: index);
                  },
                );
              },
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
                onPressed: () => ref.read(notesProvider.notifier).loadNotes(),
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
            MaterialPageRoute(builder: (context) => const NoteEditorScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('New Note'),
      ),
    );
  }
}

class _NoteCard extends ConsumerWidget {
  final Note note;
  final int index;

  const _NoteCard({required this.note, required this.index});

  // Vibrant pastel colors for notes
  static const List<Color> cardColors = [
    Color(0xFFFFD6E8), // Pink
    Color(0xFFFFE8CC), // Peach
    Color(0xFFFFFACC), // Yellow
    Color(0xFFCCF5E1), // Mint
    Color(0xFFD6E8FF), // Blue
    Color(0xFFE8D6FF), // Purple
    Color(0xFFFFCCCC), // Coral
    Color(0xFFCCFFE8), // Green
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final color = cardColors[index % cardColors.length];
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      decoration: BoxDecoration(
        color: isDark ? color.withOpacity(0.2) : color,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => NoteEditorScreen(note: note),
              ),
            );
          },
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        note.title,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.edit_note,
                        size: 20,
                        color: isDark ? Colors.white70 : Colors.black54,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: Text(
                    note.content,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: isDark ? Colors.white70 : Colors.black87,
                          height: 1.5,
                        ),
                    maxLines: 5,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.schedule,
                      size: 14,
                      color: isDark ? Colors.white54 : Colors.black54,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat('MMM dd, yyyy').format(note.updatedAt),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: isDark ? Colors.white54 : Colors.black54,
                          ),
                    ),
                    if (note.tags.isNotEmpty) ...[
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.6),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.tag,
                              size: 12,
                              color: isDark ? Colors.white70 : Colors.black54,
                            ),
                            const SizedBox(width: 2),
                            Text(
                              '${note.tags.length}',
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white70 : Colors.black87,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
