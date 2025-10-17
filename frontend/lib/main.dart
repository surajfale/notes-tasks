import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
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
    final authState = ref.watch(authStateProvider);

    return MaterialApp(
      title: 'Notes & Tasks',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        textTheme: GoogleFonts.interTextTheme(),
        useMaterial3: true,
      ),
      home: authState.isLoading
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : authState.isAuthenticated
              ? const HomeScreen()
              : const LoginScreen(),
    );
  }
}

