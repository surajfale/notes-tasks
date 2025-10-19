# Flutter Frontend Implementation Guide

Complete implementation reference for the Notes & Tasks Flutter Web frontend.

**Status**: Frontend is fully implemented. This document serves as a reference for the architecture and patterns used.

## Current Implementation

The frontend is already built with:
- ✅ Authentication (login, register)
- ✅ JWT token management
- ✅ Account management (settings, delete account)
- ✅ Theme customization (light/dark mode, accent colors)
- ✅ Notes feature (list, create, edit, delete)
- ✅ Tasks feature (list, create, edit, delete)
- ✅ Home screen with navigation
- ✅ Responsive layout (desktop and mobile)
- ✅ Freezed models for type safety
- ✅ Riverpod 3.0 with code generation

## Running the Project

1. Ensure backend is running on `http://localhost:3000`
2. Run the frontend:
   ```bash
   cd frontend
   flutter pub get
   flutter pub run build_runner build --delete-conflicting-outputs
   flutter run -d chrome
   ```

## Dependencies (pubspec.yaml)

**Updated 2025** - Latest versions with breaking changes resolved:

```yaml
name: notes_tasks_frontend
description: Notes & Tasks Web Application
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # State Management (Riverpod 3.0)
  flutter_riverpod: ^3.0.3
  riverpod_annotation: ^3.0.3
  
  # HTTP & API
  dio: ^5.4.0
  
  # Local Storage
  shared_preferences: ^2.2.3
  
  # UI
  google_fonts: ^6.2.1
  flutter_slidable: ^4.0.3
  intl: ^0.20.2
  flutter_markdown: ^0.7.7+1
  
  # Utilities
  freezed_annotation: ^3.1.0
  json_annotation: ^4.9.0
  logger: ^2.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^6.0.0
  
  # Code Generation
  build_runner: ^2.7.1
  riverpod_generator: ^3.0.3
  freezed: ^3.2.3
  json_serializable: ^6.11.1
  
  # Testing
  mockito: ^5.5.0

flutter:
  uses-material-design: true
```

## Project Structure

Create these directories:

```
frontend/lib/
├── core/
│   ├── api/
│   │   ├── api_client.dart
│   │   ├── api_service.dart
│   │   └── dio_provider.dart
│   ├── config/
│   │   └── app_config.dart
│   ├── storage/
│   │   └── token_storage.dart
│   ├── theme/
│   │   └── app_theme.dart
│   └── models/
│       ├── user.dart
│       ├── list_model.dart
│       ├── note.dart
│       └── task.dart
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   └── auth_repository.dart
│   │   ├── providers/
│   │   │   └── auth_provider.dart
│   │   └── presentation/
│   │       ├── login_screen.dart
│   │       └── register_screen.dart
│   ├── lists/
│   │   ├── data/
│   │   │   └── lists_repository.dart
│   │   ├── providers/
│   │   │   └── lists_provider.dart
│   │   └── presentation/
│   │       └── lists_screen.dart
│   ├── notes/
│   │   ├── data/
│   │   │   └── notes_repository.dart
│   │   ├── providers/
│   │   │   └── notes_provider.dart
│   │   └── presentation/
│   │       ├── notes_screen.dart
│   │       └── note_editor_screen.dart
│   └── tasks/
│       ├── data/
│       │   └── tasks_repository.dart
│       ├── providers/
│       │   └── tasks_provider.dart
│       └── presentation/
│           ├── tasks_screen.dart
│           └── task_editor_screen.dart
└── main.dart
```

## Core Files

### 1. lib/core/config/app_config.dart

```dart
class AppConfig {
  static const String apiBaseUrl = 'http://localhost:3000/api';
  static const String appName = 'Notes & Tasks';
  static const bool isDevelopment = true;
  
  // Storage keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
}
```

### 2. lib/core/api/dio_provider.dart

```dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../storage/token_storage.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 5),
    receiveTimeout: const Duration(seconds: 3),
    headers: {
      'Content-Type': 'application/json',
    },
  ));

  // Request interceptor to add JWT token
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await TokenStorage.getToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    },
    onError: (error, handler) async {
      if (error.response?.statusCode == 401) {
        // Token expired, logout user
        await TokenStorage.clearToken();
        // Navigate to login (implement in your app)
      }
      return handler.next(error);
    },
  ));

  return dio;
});
```

### 3. lib/core/storage/token_storage.dart

```dart
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class TokenStorage {
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConfig.tokenKey, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConfig.tokenKey);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConfig.tokenKey);
  }

  static Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
```

### 4. lib/core/models/user.dart

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
class User with _$User {
  const factory User({
    required String id,
    required String username,
    required String email,
    required String displayName,
    required DateTime createdAt,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

@freezed
class AuthResponse with _$AuthResponse {
  const factory AuthResponse({
    required String token,
    required User user,
  }) = _AuthResponse;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}
```

### 5. lib/features/auth/data/auth_repository.dart

```dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/dio_provider.dart';
import '../../../core/models/user.dart';
import '../../../core/storage/token_storage.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioProvider));
});

class AuthRepository {
  final Dio _dio;

  AuthRepository(this._dio);

  Future<AuthResponse> register({
    required String username,
    required String email,
    required String password,
    String? displayName,
  }) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'username': username,
        'email': email,
        'password': password,
        if (displayName != null) 'displayName': displayName,
      });

      final authResponse = AuthResponse.fromJson(response.data);
      await TokenStorage.saveToken(authResponse.token);
      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<AuthResponse> login({
    required String username,
    required String password,
  }) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'username': username,
        'password': password,
      });

      final authResponse = AuthResponse.fromJson(response.data);
      await TokenStorage.saveToken(authResponse.token);
      return authResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> logout() async {
    await TokenStorage.clearToken();
  }

  Future<User?> getCurrentUser() async {
    final hasToken = await TokenStorage.hasToken();
    if (!hasToken) return null;

    try {
      final response = await _dio.get('/auth/me');
      return User.fromJson(response.data['user']);
    } catch (e) {
      await TokenStorage.clearToken();
      return null;
    }
  }

  String _handleError(DioException e) {
    if (e.response != null) {
      final data = e.response!.data;
      if (data is Map && data.containsKey('error')) {
        return data['error']['message'] ?? 'An error occurred';
      }
    }
    return 'Network error. Please try again.';
  }
}
```

### 6. lib/features/auth/providers/auth_provider.dart

**Updated for Riverpod 3.0** - Uses code generation with `@riverpod` annotation:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/models/user.dart';
import '../data/auth_repository.dart';

part 'auth_provider.g.dart';

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  AuthState({this.user, this.isLoading = false, this.error});

  bool get isAuthenticated => user != null;

  AuthState copyWith({User? user, bool? isLoading, String? error}) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

@riverpod
class AuthStateNotifier extends _$AuthStateNotifier {
  @override
  AuthState build() {
    checkAuthStatus();
    return AuthState();
  }

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    try {
      final user = await ref.read(authRepositoryProvider).getCurrentUser();
      state = AuthState(user: user, isLoading: false);
    } catch (e) {
      state = AuthState(isLoading: false);
    }
  }

  Future<void> login(String username, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final authResponse = await ref.read(authRepositoryProvider).login(
        username: username,
        password: password,
      );
      state = AuthState(user: authResponse.user, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> register({
    required String username,
    required String email,
    required String password,
    String? displayName,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final authResponse = await ref.read(authRepositoryProvider).register(
        username: username,
        email: email,
        password: password,
        displayName: displayName,
      );
      state = AuthState(user: authResponse.user, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = AuthState(isLoading: false);
  }
}
```

**Key Changes from Riverpod 2 to 3:**
- Removed `StateNotifier` and `StateNotifierProvider`
- Added `@riverpod` annotation for code generation
- Class extends generated `_$AuthStateNotifier`
- Added `part 'auth_provider.g.dart'` directive
- Provider accessed via generated `authStateProvider`
- Repository accessed via `ref.read()` instead of constructor injection

### 7. lib/features/auth/presentation/login_screen.dart

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      await ref.read(authStateProvider.notifier).login(
            _usernameController.text.trim(),
            _passwordController.text,
          );
      
      if (mounted) {
        // Navigate to home screen
        // Navigator.of(context).pushReplacementNamed('/home');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 400),
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(
                    Icons.note_alt_outlined,
                    size: 64,
                    color: Theme.of(context).primaryColor,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Notes & Tasks',
                    style: Theme.of(context).textTheme.headlineMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 48),
                  TextFormField(
                    controller: _usernameController,
                    decoration: const InputDecoration(
                      labelText: 'Username',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your username';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.lock),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility
                              : Icons.visibility_off,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your password';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: authState.isLoading ? null : _handleLogin,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: authState.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Login'),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () {
                      // Navigate to register screen
                      // Navigator.of(context).pushNamed('/register');
                    },
                    child: const Text('Don\'t have an account? Register'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

### 8. lib/main.dart

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/providers/auth_provider.dart';

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
              ? const HomeScreen() // Create this
              : const LoginScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: const Center(child: Text('Home Screen - To be implemented')),
    );
  }
}
```

## Actual Project Structure

The implemented structure:

```
frontend/lib/
├── core/
│   ├── api/
│   │   └── dio_provider.dart          # HTTP client with JWT
│   ├── config/
│   │   └── app_config.dart             # API base URL config
│   ├── models/
│   │   ├── user.dart                   # User model
│   │   ├── note.dart                   # Note model
│   │   └── task.dart                   # Task model
│   └── storage/
│       └── token_storage.dart          # JWT token storage
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   └── auth_repository.dart    # Auth API calls
│   │   ├── presentation/
│   │   │   ├── login_screen.dart       # Login UI
│   │   │   └── register_screen.dart    # Register UI
│   │   └── providers/
│   │       └── auth_provider.dart      # Auth state
│   ├── home/
│   │   └── home_screen.dart            # Main navigation
│   ├── notes/
│   │   ├── data/
│   │   │   └── notes_repository.dart   # Notes API
│   │   ├── presentation/
│   │   │   ├── notes_screen.dart       # Notes list
│   │   │   └── note_editor_screen.dart # Note editor
│   │   └── providers/
│   │       └── notes_provider.dart     # Notes state
│   └── tasks/
│       ├── data/
│       │   └── tasks_repository.dart   # Tasks API
│       ├── presentation/
│       │   ├── tasks_screen.dart       # Tasks list
│       │   └── task_editor_screen.dart # Task editor
│       └── providers/
│           └── tasks_provider.dart     # Tasks state
└── main.dart                            # App entry point
```

## Quick Start

1. **Start backend**:
```bash
cd backend
npm run dev
```

2. **Run frontend**:
```bash
cd frontend
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run -d chrome
```

## Extending the Application

To add new features:

1. **Add Lists feature**:
   - Create `features/lists/` following the same pattern
   - Backend API already supports lists
   - Use existing repository pattern

2. **Add offline support**:
   - Integrate IndexedDB with idb_shim
   - Cache data locally
   - Sync when online

3. **Enhance UI**:
   - Add animations
   - Improve loading states
   - Add error boundaries

4. **Add tests**:
   - Unit tests for repositories
   - Widget tests for screens
   - Integration tests

## Common Issues

- **CORS errors**: Ensure backend CORS_ORIGINS includes `http://localhost:8080`
- **Code generation errors**: Run `flutter pub run build_runner clean` first
- **Import errors**: Run `flutter pub get` and restart IDE

This provides the foundation. Extend with similar patterns for lists, notes, and tasks.
