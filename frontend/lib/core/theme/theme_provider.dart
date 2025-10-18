import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_theme.dart';

final themeProvider = StateNotifierProvider<ThemeNotifier, AppThemeMode>((ref) {
  return ThemeNotifier();
});

class ThemeNotifier extends StateNotifier<AppThemeMode> {
  ThemeNotifier() : super(AppThemeMode.ocean);

  void setTheme(AppThemeMode theme) {
    state = theme;
  }
}
