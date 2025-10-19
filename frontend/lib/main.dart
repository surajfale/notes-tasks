import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/home/home_screen.dart';

void main() {
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateNotifierProvider);
    final themeMode = ref.watch(themeNotifierProvider);
    final accentColor = ref.watch(accentColorNotifierProvider);

    return MaterialApp(
      title: 'Notes & Tasks',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.getLightTheme(accentColor: accentColor),
      darkTheme: AppTheme.getDarkTheme(accentColor: accentColor),
      themeMode: themeMode,
      home: authState.isLoading
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : authState.isAuthenticated
              ? const HomeScreen()
              : const LoginScreen(),
    );
  }
}

