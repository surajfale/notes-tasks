import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class TasksScreen extends ConsumerWidget {
  const TasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Text(
        'Tasks - Coming Soon',
        style: Theme.of(context).textTheme.headlineMedium,
      ),
    );
  }
}
