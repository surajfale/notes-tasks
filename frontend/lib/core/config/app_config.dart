class AppConfig {
  // API URL - defaults to localhost for development
  // In production, set this via --dart-define or environment variable
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api',
  );
  
  static const String appName = 'Notes & Tasks';
  static const bool isDevelopment = bool.fromEnvironment(
    'DEVELOPMENT',
    defaultValue: true,
  );
  
  // Storage keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
}
