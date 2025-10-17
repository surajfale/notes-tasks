import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/user.dart';
import '../data/auth_repository.dart';

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});

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

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(AuthState()) {
    checkAuthStatus();
  }

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    try {
      final user = await _repository.getCurrentUser();
      state = AuthState(user: user, isLoading: false);
    } catch (e) {
      state = AuthState(isLoading: false);
    }
  }

  Future<void> login(String username, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final authResponse = await _repository.login(
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
      final authResponse = await _repository.register(
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
    await _repository.logout();
    state = AuthState(isLoading: false);
  }
}
