import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum AppThemeMode {
  ocean,
  sunset,
  forest,
  lavender,
  rose,
  midnight,
}

class AppTheme {
  static ThemeData getTheme(AppThemeMode themeMode, Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final colors = _getThemeColors(themeMode, isDark);

    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: colors.primary,
        brightness: brightness,
      ).copyWith(
        primary: colors.primary,
        secondary: colors.secondary,
        tertiary: colors.tertiary,
        surface: colors.surface,
        surfaceContainerHighest: colors.surfaceVariant,
      ),
      textTheme: GoogleFonts.interTextTheme(
        isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme,
      ),
      useMaterial3: true,
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        color: colors.surface,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          foregroundColor: Colors.white,
          backgroundColor: colors.primary,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.primary, width: 2),
        ),
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: false,
        backgroundColor: Colors.transparent,
        foregroundColor: isDark ? Colors.white : colors.onSurface,
      ),
    );
  }

  static _ThemeColors _getThemeColors(AppThemeMode mode, bool isDark) {
    switch (mode) {
      case AppThemeMode.ocean:
        return isDark
            ? _ThemeColors(
                primary: const Color(0xFF4FC3F7),
                secondary: const Color(0xFF26C6DA),
                tertiary: const Color(0xFF00ACC1),
                surface: const Color(0xFF1A1F2E),
                surfaceVariant: const Color(0xFF2A3142),
                border: const Color(0xFF3A4152),
                onSurface: const Color(0xFFE1E8ED),
              )
            : _ThemeColors(
                primary: const Color(0xFF0288D1),
                secondary: const Color(0xFF0097A7),
                tertiary: const Color(0xFF00838F),
                surface: Colors.white,
                surfaceVariant: const Color(0xFFF0F8FF),
                border: const Color(0xFFB3E5FC),
                onSurface: const Color(0xFF1A1F2E),
              );

      case AppThemeMode.sunset:
        return isDark
            ? _ThemeColors(
                primary: const Color(0xFFFF7043),
                secondary: const Color(0xFFFFAB91),
                tertiary: const Color(0xFFFF8A65),
                surface: const Color(0xFF1A1A1A),
                surfaceVariant: const Color(0xFF2A2A2A),
                border: const Color(0xFF3A3A3A),
                onSurface: const Color(0xFFFFF3E0),
              )
            : _ThemeColors(
                primary: const Color(0xFFFF5722),
                secondary: const Color(0xFFFF7043),
                tertiary: const Color(0xFFFF6F00),
                surface: Colors.white,
                surfaceVariant: const Color(0xFFFFF3E0),
                border: const Color(0xFFFFCCBC),
                onSurface: const Color(0xFF1A1A1A),
              );

      case AppThemeMode.forest:
        return isDark
            ? _ThemeColors(
                primary: const Color(0xFF66BB6A),
                secondary: const Color(0xFF81C784),
                tertiary: const Color(0xFF4DB6AC),
                surface: const Color(0xFF1B2A1B),
                surfaceVariant: const Color(0xFF2A3A2A),
                border: const Color(0xFF3A4A3A),
                onSurface: const Color(0xFFE8F5E9),
              )
            : _ThemeColors(
                primary: const Color(0xFF388E3C),
                secondary: const Color(0xFF4CAF50),
                tertiary: const Color(0xFF009688),
                surface: Colors.white,
                surfaceVariant: const Color(0xFFE8F5E9),
                border: const Color(0xFFA5D6A7),
                onSurface: const Color(0xFF1B2A1B),
              );

      case AppThemeMode.lavender:
        return isDark
            ? _ThemeColors(
                primary: const Color(0xFFB39DDB),
                secondary: const Color(0xFF9575CD),
                tertiary: const Color(0xFFBA68C8),
                surface: const Color(0xFF1A1625),
                surfaceVariant: const Color(0xFF2A2535),
                border: const Color(0xFF3A3545),
                onSurface: const Color(0xFFF3E5F5),
              )
            : _ThemeColors(
                primary: const Color(0xFF7E57C2),
                secondary: const Color(0xFF9575CD),
                tertiary: const Color(0xFFAB47BC),
                surface: Colors.white,
                surfaceVariant: const Color(0xFFF3E5F5),
                border: const Color(0xFFCE93D8),
                onSurface: const Color(0xFF1A1625),
              );

      case AppThemeMode.rose:
        return isDark
            ? _ThemeColors(
                primary: const Color(0xFFF48FB1),
                secondary: const Color(0xFFEC407A),
                tertiary: const Color(0xFFAB47BC),
                surface: const Color(0xFF1F1A1D),
                surfaceVariant: const Color(0xFF2F2A2D),
                border: const Color(0xFF3F3A3D),
                onSurface: const Color(0xFFFCE4EC),
              )
            : _ThemeColors(
                primary: const Color(0xFFE91E63),
                secondary: const Color(0xFFF06292),
                tertiary: const Color(0xFFBA68C8),
                surface: Colors.white,
                surfaceVariant: const Color(0xFFFCE4EC),
                border: const Color(0xFFF8BBD0),
                onSurface: const Color(0xFF1F1A1D),
              );

      case AppThemeMode.midnight:
        return isDark
            ? _ThemeColors(
                primary: const Color(0xFF7C4DFF),
                secondary: const Color(0xFF536DFE),
                tertiary: const Color(0xFF448AFF),
                surface: const Color(0xFF0F0F1E),
                surfaceVariant: const Color(0xFF1A1A2E),
                border: const Color(0xFF2A2A3E),
                onSurface: const Color(0xFFE8E9F3),
              )
            : _ThemeColors(
                primary: const Color(0xFF5E35B1),
                secondary: const Color(0xFF3F51B5),
                tertiary: const Color(0xFF1E88E5),
                surface: Colors.white,
                surfaceVariant: const Color(0xFFE8E9F3),
                border: const Color(0xFFB5B9D8),
                onSurface: const Color(0xFF0F0F1E),
              );
    }
  }

  static List<Color> getGradientColors(AppThemeMode mode, bool isDark) {
    switch (mode) {
      case AppThemeMode.ocean:
        return isDark
            ? [const Color(0xFF1A2F3E), const Color(0xFF2A4F5E), const Color(0xFF006D8F)]
            : [const Color(0xFF0288D1), const Color(0xFF0097A7), const Color(0xFF00ACC1)];
      case AppThemeMode.sunset:
        return isDark
            ? [const Color(0xFF1A1A1A), const Color(0xFF2A1A1A), const Color(0xFFBF360C)]
            : [const Color(0xFFFF5722), const Color(0xFFFF7043), const Color(0xFFFF6F00)];
      case AppThemeMode.forest:
        return isDark
            ? [const Color(0xFF1B2A1B), const Color(0xFF2A3A2A), const Color(0xFF2E7D32)]
            : [const Color(0xFF388E3C), const Color(0xFF4CAF50), const Color(0xFF009688)];
      case AppThemeMode.lavender:
        return isDark
            ? [const Color(0xFF1A1625), const Color(0xFF2A2535), const Color(0xFF512DA8)]
            : [const Color(0xFF7E57C2), const Color(0xFF9575CD), const Color(0xFFAB47BC)];
      case AppThemeMode.rose:
        return isDark
            ? [const Color(0xFF1F1A1D), const Color(0xFF2F2A2D), const Color(0xFFC2185B)]
            : [const Color(0xFFE91E63), const Color(0xFFF06292), const Color(0xFFBA68C8)];
      case AppThemeMode.midnight:
        return isDark
            ? [const Color(0xFF0F0F1E), const Color(0xFF1A1A2E), const Color(0xFF4527A0)]
            : [const Color(0xFF5E35B1), const Color(0xFF3F51B5), const Color(0xFF1E88E5)];
    }
  }

  static String getThemeName(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.ocean:
        return 'Ocean Blue';
      case AppThemeMode.sunset:
        return 'Sunset Orange';
      case AppThemeMode.forest:
        return 'Forest Green';
      case AppThemeMode.lavender:
        return 'Lavender Purple';
      case AppThemeMode.rose:
        return 'Rose Pink';
      case AppThemeMode.midnight:
        return 'Midnight Blue';
    }
  }

  static IconData getThemeIcon(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.ocean:
        return Icons.water;
      case AppThemeMode.sunset:
        return Icons.wb_sunny;
      case AppThemeMode.forest:
        return Icons.nature;
      case AppThemeMode.lavender:
        return Icons.spa;
      case AppThemeMode.rose:
        return Icons.favorite;
      case AppThemeMode.midnight:
        return Icons.nightlight;
    }
  }
}

class _ThemeColors {
  final Color primary;
  final Color secondary;
  final Color tertiary;
  final Color surface;
  final Color surfaceVariant;
  final Color border;
  final Color onSurface;

  _ThemeColors({
    required this.primary,
    required this.secondary,
    required this.tertiary,
    required this.surface,
    required this.surfaceVariant,
    required this.border,
    required this.onSurface,
  });
}
