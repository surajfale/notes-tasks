import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/home/home_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../theme/theme_provider.dart';

/// A consistent scaffold wrapper that provides header, sidebar, and footer
/// across all screens in the app (notes list, tasks list, editors, etc.)
class AppScaffold extends ConsumerWidget {
  final Widget child;
  final String title;
  final List<Widget>? actions;
  final Widget? floatingActionButton;
  final bool? resizeToAvoidBottomInset;

  const AppScaffold({
    super.key,
    required this.child,
    required this.title,
    this.actions,
    this.floatingActionButton,
    this.resizeToAvoidBottomInset,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateNotifierProvider);
    final user = authState.user;
    final currentPage = ref.watch(currentPageProvider);
    final isDesktop = MediaQuery.of(context).size.width >= 840;

    return Scaffold(
      // Key is important for accessing the Scaffold state
      key: GlobalKey<ScaffoldState>(),
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
      // Only show drawer on mobile/tablet (not desktop)
      drawer: !isDesktop ? _buildDrawer(context, ref, user, currentPage) : null,
      appBar: _buildAppBar(context, ref, isDesktop, user),
      body: Row(
        children: [
          // Desktop sidebar
          if (isDesktop) _buildDesktopSidebar(context, ref, currentPage),
          if (isDesktop) const VerticalDivider(width: 1, thickness: 1),
          // Main content
          Expanded(
            child: Column(
              children: [
                Expanded(child: child),
                _buildFooter(context),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: floatingActionButton,
      bottomNavigationBar: !isDesktop && (title == 'Notes' || title == 'Tasks')
          ? _buildBottomNav(context, ref, currentPage)
          : null,
    );
  }

  PreferredSizeWidget _buildAppBar(
      BuildContext context, WidgetRef ref, bool isDesktop, dynamic user) {
    return AppBar(
      elevation: 0,
      backgroundColor: Theme.of(context).colorScheme.surface,
      surfaceTintColor: Theme.of(context).colorScheme.surfaceTint,
      // Show hamburger menu on mobile/tablet only
      leading: !isDesktop
          ? Builder(
              builder: (BuildContext ctx) {
                return IconButton(
                  icon: const Icon(Icons.menu),
                  onPressed: () {
                    Scaffold.of(ctx).openDrawer();
                  },
                  tooltip: 'Menu',
                );
              },
            )
          : null,
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.note_alt_outlined,
            size: 24,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(width: 12),
          Text(
            title,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 20,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ],
      ),
      actions: [
        if (actions != null) ...actions!,
        if (!isDesktop) ...[
          IconButton(
            icon: const Icon(Icons.palette),
            onPressed: () => _showAppearanceSettings(context, ref),
            tooltip: 'Appearance',
          ),
          PopupMenuButton<String>(
            icon: CircleAvatar(
              radius: 16,
              backgroundColor: Theme.of(context).colorScheme.primaryContainer,
              foregroundColor: Theme.of(context).colorScheme.onPrimaryContainer,
              child: Text(
                user?.displayName[0].toUpperCase() ?? 'U',
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
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
        ],
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildDesktopSidebar(
      BuildContext context, WidgetRef ref, int currentPage) {
    final isExtended = MediaQuery.of(context).size.width >= 1200;
    final authState = ref.watch(authStateNotifierProvider);
    final user = authState.user;

    return Container(
      width: isExtended ? 280 : 80,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          right: BorderSide(
            color: Theme.of(context).colorScheme.outlineVariant,
            width: 1,
          ),
        ),
      ),
      child: Column(
        children: [
          // App branding
          Padding(
            padding: EdgeInsets.symmetric(
                vertical: 24.0, horizontal: isExtended ? 20.0 : 12.0),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    Icons.note_alt_outlined,
                    size: 32,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                if (isExtended) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Notes & Tasks',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),
          Divider(
              height: 1, color: Theme.of(context).colorScheme.outlineVariant),
          const SizedBox(height: 8),
          // Navigation items
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              children: [
                _buildNavTile(
                  context: context,
                  ref: ref,
                  icon: Icons.note_outlined,
                  selectedIcon: Icons.note,
                  label: 'Notes',
                  isSelected: currentPage == 0,
                  isExtended: isExtended,
                  onTap: () => ref.read(currentPageProvider.notifier).state = 0,
                ),
                const SizedBox(height: 4),
                _buildNavTile(
                  context: context,
                  ref: ref,
                  icon: Icons.task_outlined,
                  selectedIcon: Icons.task,
                  label: 'Tasks',
                  isSelected: currentPage == 1,
                  isExtended: isExtended,
                  onTap: () => ref.read(currentPageProvider.notifier).state = 1,
                ),
              ],
            ),
          ),
          // Bottom actions
          Divider(
              height: 1, color: Theme.of(context).colorScheme.outlineVariant),
          Padding(
            padding:
                const EdgeInsets.symmetric(vertical: 12.0, horizontal: 8.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildNavTile(
                  context: context,
                  ref: ref,
                  icon: Icons.palette_outlined,
                  selectedIcon: Icons.palette,
                  label: 'Appearance',
                  isSelected: false,
                  isExtended: isExtended,
                  onTap: () => _showAppearanceSettings(context, ref),
                ),
                const SizedBox(height: 4),
                _buildNavTile(
                  context: context,
                  ref: ref,
                  icon: Icons.person_outline,
                  selectedIcon: Icons.person,
                  label: user?.displayName ?? 'Profile',
                  isSelected: false,
                  isExtended: isExtended,
                  onTap: () => _showProfileDialog(context, ref, user),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavTile({
    required BuildContext context,
    required WidgetRef ref,
    required IconData icon,
    required IconData selectedIcon,
    required String label,
    required bool isSelected,
    required bool isExtended,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? Theme.of(context).colorScheme.primaryContainer
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(
                isSelected ? selectedIcon : icon,
                size: 24,
                color: isSelected
                    ? Theme.of(context).colorScheme.onPrimaryContainer
                    : Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              if (isExtended) ...[
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w500,
                      color: isSelected
                          ? Theme.of(context).colorScheme.onPrimaryContainer
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawer(
      BuildContext context, WidgetRef ref, dynamic user, int currentPage) {
    return Drawer(
      child: Container(
        color: Theme.of(context).colorScheme.surface,
        child: SafeArea(
          child: Column(
            children: [
              // App branding
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Icon(
                        Icons.note_alt_outlined,
                        size: 48,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Notes & Tasks',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 22,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
              ),
              Divider(
                  height: 1,
                  color: Theme.of(context).colorScheme.outlineVariant),
              const SizedBox(height: 12),
              // Navigation items
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: [
                    _buildDrawerTile(
                      context: context,
                      ref: ref,
                      icon: Icons.note_outlined,
                      selectedIcon: Icons.note,
                      label: 'Notes',
                      isSelected: currentPage == 0,
                      onTap: () {
                        ref.read(currentPageProvider.notifier).state = 0;
                        Navigator.pop(context);
                      },
                    ),
                    const SizedBox(height: 8),
                    _buildDrawerTile(
                      context: context,
                      ref: ref,
                      icon: Icons.task_outlined,
                      selectedIcon: Icons.task,
                      label: 'Tasks',
                      isSelected: currentPage == 1,
                      onTap: () {
                        ref.read(currentPageProvider.notifier).state = 1;
                        Navigator.pop(context);
                      },
                    ),
                    const SizedBox(height: 20),
                    Divider(
                        color: Theme.of(context).colorScheme.outlineVariant),
                    const SizedBox(height: 8),
                    _buildDrawerTile(
                      context: context,
                      ref: ref,
                      icon: Icons.palette_outlined,
                      selectedIcon: Icons.palette,
                      label: 'Appearance',
                      isSelected: false,
                      onTap: () {
                        Navigator.pop(context);
                        _showAppearanceSettings(context, ref);
                      },
                    ),
                  ],
                ),
              ),
              // User profile section
              Divider(
                  height: 1,
                  color: Theme.of(context).colorScheme.outlineVariant),
              if (user != null)
                InkWell(
                  onTap: () {
                    Navigator.pop(context);
                    _showProfileDialog(context, ref, user);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundColor:
                              Theme.of(context).colorScheme.primaryContainer,
                          foregroundColor:
                              Theme.of(context).colorScheme.onPrimaryContainer,
                          child: Text(
                            user.displayName[0].toUpperCase(),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user.displayName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                user.email,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurfaceVariant,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawerTile({
    required BuildContext context,
    required WidgetRef ref,
    required IconData icon,
    required IconData selectedIcon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: isSelected
                ? Theme.of(context).colorScheme.primaryContainer
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(
                isSelected ? selectedIcon : icon,
                size: 24,
                color: isSelected
                    ? Theme.of(context).colorScheme.onPrimaryContainer
                    : Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: 16),
              Text(
                label,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected
                      ? Theme.of(context).colorScheme.onPrimaryContainer
                      : Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNav(BuildContext context, WidgetRef ref, int currentPage) {
    return NavigationBar(
      selectedIndex: currentPage,
      onDestinationSelected: (index) {
        ref.read(currentPageProvider.notifier).state = index;
      },
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.note_outlined),
          selectedIcon: Icon(Icons.note),
          label: 'Notes',
        ),
        NavigationDestination(
          icon: Icon(Icons.task_outlined),
          selectedIcon: Icon(Icons.task),
          label: 'Tasks',
        ),
      ],
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        border: Border(
          top: BorderSide(
            color: Theme.of(context).colorScheme.outlineVariant,
            width: 1,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.favorite,
            size: 16,
            color: Colors.red,
          ),
          const SizedBox(width: 8),
          Text(
            'Developed by Suraj',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
          ),
        ],
      ),
    );
  }

  void _showProfileDialog(BuildContext context, WidgetRef ref, dynamic user) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Profile'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: Theme.of(context).colorScheme.primaryContainer,
              foregroundColor: Theme.of(context).colorScheme.onPrimaryContainer,
              child: Text(
                user?.displayName[0].toUpperCase() ?? 'U',
                style:
                    const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              user?.displayName ?? '',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 4),
            Text(
              user?.email ?? '',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(authStateNotifierProvider.notifier).logout();
            },
          ),
          TextButton.icon(
            icon: const Icon(Icons.delete_forever),
            label: const Text('Delete Account'),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            onPressed: () {
              Navigator.pop(context);
              _showDeleteAccountDialog(context, ref);
            },
          ),
        ],
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
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const SettingsScreen(),
      ),
    );
  }
}
