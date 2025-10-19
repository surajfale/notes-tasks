import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/layout/app_scaffold.dart';
import '../notes/presentation/notes_screen.dart';
import '../notes/presentation/note_editor_screen.dart';
import '../tasks/presentation/tasks_screen.dart';
import '../tasks/presentation/task_editor_screen.dart';

// Provider to track current page
final currentPageProvider = StateProvider<int>((ref) => 0);

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentPage = ref.watch(currentPageProvider);

    final screens = [
      const NotesScreenContent(),
      const TasksScreenContent(),
    ];

    final titles = ['Notes', 'Tasks'];

    final fabs = [
      // Notes FAB
      FloatingActionButton.extended(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (context) => const NoteEditorScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('New Note'),
      ),
      // Tasks FAB
      FloatingActionButton.extended(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (context) => const TaskEditorScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('New Task'),
      ),
    ];

    return AppScaffold(
      title: titles[currentPage],
      child: screens[currentPage],
      floatingActionButton: fabs[currentPage],
      actions: currentPage == 0
          ? [
              IconButton(
                icon: const Icon(Icons.search),
                onPressed: () {
                  ref.read(showSearchProvider.notifier).toggle();
                },
              ),
            ]
          : null,
    );
  }
}
