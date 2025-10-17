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
