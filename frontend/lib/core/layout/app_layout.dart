import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../theme/theme_provider.dart';

// Provider for sidebar visibility on mobile
final sidebarVisibleProvider = StateProvider<bool>((ref) => false);

class AppLayout extends ConsumerWidget {
  final Widget child;
  final String title;
  final List<Widget>? actions;

  const AppLayout({
    super.key,
    required this.child,
    required this.title,
    this.actions,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateNotifierProvider);
    final user = authState.user;
    final isDesktop = MediaQuery.of(context).size.width >= 840;

    return Column(
      children: [
        // Header (App Bar)
        _AppHeader(
          title: title,
          actions: actions,
          user: user,
          showMenuButton: !isDesktop,
        ),
        // Content
        Expanded(child: child),
        // Footer
        const _AppFooter(),
      ],
    );
  }
}

class _AppHeader extends ConsumerWidget {
  final String title;
  final List<Widget>? actions;
  final dynamic user;
  final bool showMenuButton;

  const _AppHeader({
    required this.title,
    this.actions,
    this.user,
    this.showMenuButton = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sidebarVisible = ref.watch(sidebarVisibleProvider);

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
          child: Row(
            children: [
              if (showMenuButton)
                IconButton(
                  icon: AnimatedRotation(
                    turns: sidebarVisible ? 0.125 : 0,
                    duration: const Duration(milliseconds: 300),
                    child: const Icon(Icons.menu),
                  ),
                  onPressed: () {
                    ref.read(sidebarVisibleProvider.notifier).state = !sidebarVisible;
                  },
                  tooltip: 'Toggle Menu',
                ),
              Icon(
                Icons.note_alt_outlined,
                size: 24,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 20,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (actions != null) ...actions!,
              IconButton(
                icon: const Icon(Icons.palette),
                onPressed: () => _showAppearanceSettings(context, ref),
                tooltip: 'Appearance',
              ),
              PopupMenuButton<String>(
                icon: CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                  foregroundColor: Theme.of(context).colorScheme.onPrimaryContainer,
                  child: Text(
                    user?.displayName[0].toUpperCase() ?? 'U',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                itemBuilder: (context) => [
                  PopupMenuItem(
                    enabled: false,
                    child: ListTile(
                      leading: const Icon(Icons.person),
                      title: Text(user?.displayName ?? ''),
                      subtitle: Text(user?.email ?? ''),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const PopupMenuDivider(),
                  const PopupMenuItem(
                    value: 'logout',
                    child: ListTile(
                      leading: Icon(Icons.logout),
                      title: Text('Logout'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const PopupMenuDivider(),
                  const PopupMenuItem(
                    value: 'delete',
                    child: ListTile(
                      leading: Icon(Icons.delete_forever, color: Colors.red),
                      title: Text('Delete Account', style: TextStyle(color: Colors.red)),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ],
                onSelected: (value) async {
                  if (value == 'logout') {
                    await ref.read(authStateNotifierProvider.notifier).logout();
                  } else if (value == 'delete') {
                    _showDeleteAccountDialog(context, ref);
                  }
                },
              ),
              const SizedBox(width: 4),
            ],
          ),
        ),
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.warning, color: Colors.red),
            SizedBox(width: 12),
            Text('Delete Account?'),
          ],
        ),
        content: const Text(
          'This will permanently delete your account and all associated data (notes, tasks, and lists). This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ref.read(authStateNotifierProvider.notifier).deleteAccount();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Account deleted successfully'),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to delete account: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showAppearanceSettings(BuildContext context, WidgetRef ref) {
    final currentAccent = ref.read(accentColorNotifierProvider);
    final currentTheme = ref.read(themeNotifierProvider);

    final accentColors = [
      const Color(0xFF6750A4), // Purple
      const Color(0xFF1976D2), // Blue
      const Color(0xFF0097A7), // Cyan
      const Color(0xFF00796B), // Teal
      const Color(0xFF388E3C), // Green
      const Color(0xFFFF6F00), // Orange
      const Color(0xFFD32F2F), // Red
      const Color(0xFFC2185B), // Pink
      const Color(0xFF7B1FA2), // Deep Purple
      const Color(0xFF303F9F), // Indigo
    ];

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Appearance'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Theme Mode',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              SegmentedButton<ThemeMode>(
                segments: const [
                  ButtonSegment(
                    value: ThemeMode.light,
                    icon: Icon(Icons.light_mode, size: 18),
                    label: Text('Light'),
                  ),
                  ButtonSegment(
                    value: ThemeMode.dark,
                    icon: Icon(Icons.dark_mode, size: 18),
                    label: Text('Dark'),
                  ),
                  ButtonSegment(
                    value: ThemeMode.system,
                    icon: Icon(Icons.auto_mode, size: 18),
                    label: Text('Auto'),
                  ),
                ],
                selected: {currentTheme},
                onSelectionChanged: (Set<ThemeMode> selection) {
                  ref.read(themeNotifierProvider.notifier).setTheme(selection.first);
                },
              ),
              const SizedBox(height: 24),
              Text(
                'Accent Color',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: accentColors.map((color) {
                  final isSelected = color.value == currentAccent.value;
                  return InkWell(
                    onTap: () {
                      ref.read(accentColorNotifierProvider.notifier).setAccentColor(color);
                    },
                    borderRadius: BorderRadius.circular(28),
                    child: Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: isSelected
                            ? Border.all(
                                color: Theme.of(context).colorScheme.outline,
                                width: 3,
                              )
                            : null,
                        boxShadow: [
                          BoxShadow(
                            color: color.withOpacity(0.4),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: isSelected
                          ? const Icon(
                              Icons.check,
                              color: Colors.white,
                              size: 28,
                            )
                          : null,
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

class _AppFooter extends StatelessWidget {
  const _AppFooter();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        border: Border(
          top: BorderSide(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.favorite,
            size: 14,
            color: Colors.red,
          ),
          const SizedBox(width: 6),
          Text(
            'Developed by Suraj',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
          ),
        ],
      ),
    );
  }
}
