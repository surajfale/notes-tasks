import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/models/note.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/notes_provider.dart';
import 'note_editor_screen.dart';
import 'widgets/note_card.dart';

part 'notes_screen.g.dart';

@riverpod
class SearchQuery extends _$SearchQuery {
  @override
  String build() => '';

  void update(String value) => state = value;
}

@riverpod
class SelectedTags extends _$SelectedTags {
  @override
  List<String> build() => [];

  void update(List<String> value) => state = value;
}

@riverpod
class ShowSearch extends _$ShowSearch {
  @override
  bool build() => false;

  void toggle() => state = !state;
  void update(bool value) => state = value;
}

class NotesScreenContent extends ConsumerStatefulWidget {
  const NotesScreenContent({super.key});

  @override
  ConsumerState<NotesScreenContent> createState() => _NotesScreenContentState();
}

class _NotesScreenContentState extends ConsumerState<NotesScreenContent> {
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

    return notesAsync.when(
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
                                  ref.read(showSearchProvider.notifier).update(false);
                                  _searchController.clear();
                                  ref.read(searchQueryProvider.notifier).update('');
                                },
                              ),
                            ),
                            onChanged: (value) {
                              ref.read(searchQueryProvider.notifier).update(value);
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
                                ref.read(selectedTagsProvider.notifier).update([
                                  ...selectedTags,
                                  tag
                                ]);
                              } else {
                                ref.read(selectedTagsProvider.notifier).update(
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
                              childAspectRatio = 1.1;
                              padding = 12;
                              spacing = 12;
                            } else if (constraints.maxWidth < 600) {
                              // Small phones (portrait)
                              crossAxisCount = 2;
                              childAspectRatio = 0.85;
                              padding = 12;
                              spacing = 12;
                            } else if (constraints.maxWidth < 840) {
                              // Large phones (landscape) / small tablets / foldables (closed)
                              crossAxisCount = 3;
                              childAspectRatio = 0.9;
                              padding = 16;
                              spacing = 12;
                            } else if (constraints.maxWidth < 1200) {
                              // Tablets / foldables (open)
                              crossAxisCount = 4;
                              childAspectRatio = 0.9;
                              padding = 16;
                              spacing = 12;
                            } else {
                              // Desktop
                              crossAxisCount = 5;
                              childAspectRatio = 0.9;
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
                              itemCount: notes.length,
                              itemBuilder: (context, index) {
                                final note = notes[index];
                                return NoteCard(note: note);
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
      );
  }
}
