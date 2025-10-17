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
