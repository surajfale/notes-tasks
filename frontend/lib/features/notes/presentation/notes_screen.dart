import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/note.dart';
import '../providers/notes_provider.dart';
import 'note_editor_screen.dart';
import 'package:intl/intl.dart';

final searchQueryProvider = StateProvider<String>((ref) => '');
final selectedTagsProvider = StateProvider<List<String>>((ref) => []);
final showSearchProvider = StateProvider<bool>((ref) => false);

class NotesScreen extends ConsumerStatefulWidget {
  const NotesScreen({super.key});

  @override
  ConsumerState<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends ConsumerState<NotesScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Note> _filterNotes(List<Note> notes) {
    final searchQuery = ref.watch(searchQueryProvider).toLowerCase();
    final selectedTags = ref.watch(selectedTagsProvider);

    return notes.where((note) {
      // Search filter
      final matchesSearch = searchQuery.isEmpty ||
          note.title.toLowerCase().contains(searchQuery) ||
          note.content.toLowerCase().contains(searchQuery) ||
          note.tags.any((tag) => tag.toLowerCase().contains(searchQuery));

      // Tag filter
      final matchesTags = selectedTags.isEmpty ||
          selectedTags.every((tag) => note.tags.contains(tag));

      return matchesSearch && matchesTags;
    }).toList();
  }

  Set<String> _getAllTags(List<Note> notes) {
    final tags = <String>{};
    for (final note in notes) {
      tags.addAll(note.tags);
    }
    return tags;
  }

  @override
  Widget build(BuildContext context) {
    final notesAsync = ref.watch(notesProvider);
    final showSearch = ref.watch(showSearchProvider);

    return Scaffold(
      body: notesAsync.when(
        data: (allNotes) {
          if (allNotes.isEmpty) {
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

          final notes = _filterNotes(allNotes);
          final allTags = _getAllTags(allNotes);
          final selectedTags = ref.watch(selectedTagsProvider);

          return RefreshIndicator(
            onRefresh: () => ref.read(notesProvider.notifier).loadNotes(),
            child: Column(
              children: [
                // Search bar
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  height: showSearch ? 80 : 0,
                  child: showSearch
                      ? Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          child: TextField(
                            controller: _searchController,
                            autofocus: true,
                            decoration: InputDecoration(
                              hintText: 'Search notes...',
                              prefixIcon: const Icon(Icons.search),
                              suffixIcon: IconButton(
                                icon: const Icon(Icons.close),
                                onPressed: () {
                                  ref.read(showSearchProvider.notifier).state = false;
                                  _searchController.clear();
                                  ref.read(searchQueryProvider.notifier).state = '';
                                },
                              ),
                            ),
                            onChanged: (value) {
                              ref.read(searchQueryProvider.notifier).state = value;
                            },
                          ),
                        )
                      : null,
                ),
                // Tag filters
                if (allTags.isNotEmpty)
                  Container(
                    height: 60,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
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
                                ref.read(selectedTagsProvider.notifier).state = [
                                  ...selectedTags,
                                  tag
                                ];
                              } else {
                                ref.read(selectedTagsProvider.notifier).state =
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
                // Notes grid
                Expanded(
                  child: notes.isEmpty
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
                                'No matching notes',
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    ),
                              ),
                            ],
                          ),
                        )
                      : LayoutBuilder(
                          builder: (context, constraints) {
                            // Improved breakpoints for better mobile/tablet/foldable support
                            int crossAxisCount;
                            double childAspectRatio;
                            double padding;
                            double spacing;

                            if (constraints.maxWidth < 360) {
                              // Very small phones
                              crossAxisCount = 1;
                              childAspectRatio = 0.95;
                              padding = 12;
                              spacing = 12;
                            } else if (constraints.maxWidth < 600) {
                              // Small phones (portrait)
                              crossAxisCount = 1;
                              childAspectRatio = 0.9;
                              padding = 16;
                              spacing = 12;
                            } else if (constraints.maxWidth < 840) {
                              // Large phones (landscape) / small tablets / foldables (closed)
                              crossAxisCount = 2;
                              childAspectRatio = 0.85;
                              padding = 16;
                              spacing = 16;
                            } else if (constraints.maxWidth < 1200) {
                              // Tablets / foldables (open)
                              crossAxisCount = 3;
                              childAspectRatio = 0.85;
                              padding = 20;
                              spacing = 16;
                            } else {
                              // Desktop
                              crossAxisCount = 4;
                              childAspectRatio = 0.85;
                              padding = 24;
                              spacing = 20;
                            }

                            return GridView.builder(
                              padding: EdgeInsets.all(padding),
                              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: crossAxisCount,
                                childAspectRatio: childAspectRatio,
                                crossAxisSpacing: spacing,
                                mainAxisSpacing: spacing,
                              ),
                              itemCount: notes.length,
                              itemBuilder: (context, index) {
                                final note = notes[index];
                                final originalIndex = allNotes.indexOf(note);
                                return _NoteCard(note: note, index: originalIndex);
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
                onPressed: () => ref.read(notesProvider.notifier).loadNotes(),
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
              MaterialPageRoute(builder: (context) => const NoteEditorScreen()),
            );
          },
          backgroundColor: Colors.transparent,
          elevation: 0,
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text(
            'New Note',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }
}

class _NoteCard extends ConsumerWidget {
  final Note note;
  final int index;

  const _NoteCard({required this.note, required this.index});

  // Modern gradient color combinations for notes
  static const List<List<Color>> cardGradients = [
    [Color(0xFFFF6B9D), Color(0xFFFF8E9E)], // Pink to Coral
    [Color(0xFFFFB75E), Color(0xFFFFD26F)], // Orange to Yellow
    [Color(0xFF6FEBC0), Color(0xFF7AE7C7)], // Mint to Teal
    [Color(0xFF5B9FFF), Color(0xFF6EAFFF)], // Blue to Sky
    [Color(0xFFA78BFA), Color(0xFFC4B5FD)], // Purple to Lavender
    [Color(0xFFFF6E91), Color(0xFFFFA4B6)], // Rose to Pink
    [Color(0xFF4ADE80), Color(0xFF6EE7B7)], // Green to Emerald
    [Color(0xFFF472B6), Color(0xFFFB7185)], // Fuchsia to Rose
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradientColors = cardGradients[index % cardGradients.length];
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return TweenAnimationBuilder<double>(
      duration: Duration(milliseconds: 300 + (index * 50)),
      tween: Tween(begin: 0.0, end: 1.0),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(0, 20 * (1 - value)),
          child: Opacity(
            opacity: value,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: isDark
                      ? gradientColors.map((c) => c.withOpacity(0.3)).toList()
                      : gradientColors,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: gradientColors[0].withOpacity(0.4),
                    blurRadius: 12,
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
                                      color: Colors.white,
                                    ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.25),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                Icons.edit_note,
                                size: 20,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Expanded(
                          child: Text(
                            note.content,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.white.withOpacity(0.9),
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
                              color: Colors.white.withOpacity(0.8),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              DateFormat('MMM dd, yyyy').format(note.updatedAt),
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: Colors.white.withOpacity(0.8),
                                  ),
                            ),
                            if (note.tags.isNotEmpty) ...[
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.25),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.tag,
                                      size: 12,
                                      color: Colors.white,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${note.tags.length}',
                                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
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
            ),
          ),
        );
      },
    );
  }
}
