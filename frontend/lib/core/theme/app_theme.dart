import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // 5 vibrant accent colors for automatic tag assignment
  static const List<Color> accentColors = [
    Color(0xFF6750A4), // Purple (default)
    Color(0xFF0B57D0), // Blue
    Color(0xFF006B5D), // Teal
    Color(0xFFB3261E), // Red
    Color(0xFF7D5700), // Orange/Gold
  ];

  // Material 3 color palette for tags - more vibrant and distinct
  static const Map<String, Color> tagColors = {
    'work': Color(0xFF0B57D0), // Blue
    'personal': Color(0xFF6750A4), // Purple
    'urgent': Color(0xFFB3261E), // Red
    'important': Color(0xFFD97706), // Orange
    'ideas': Color(0xFF7D5700), // Gold
    'shopping': Color(0xFF006B5D), // Teal
    'health': Color(0xFF14B8A6), // Cyan
    'finance': Color(0xFF16A34A), // Green
    'travel': Color(0xFF0891B2), // Sky Blue
    'learning': Color(0xFF9333EA), // Violet
  };

  // Get color for a tag - uses predefined colors or auto-assigns from accent palette
  static Color getTagColor(String? tag) {
    if (tag == null || tag.isEmpty) return const Color(0xFF6B7280);

    final lowerTag = tag.toLowerCase();

    // Check if predefined color exists
    if (tagColors.containsKey(lowerTag)) {
      return tagColors[lowerTag]!;
    }

    // Auto-assign color based on tag name hash for consistent colors
    final hash = lowerTag.hashCode;
    final colorIndex = hash.abs() % accentColors.length;
    return accentColors[colorIndex];
  }

  // Get all available accent colors for color picker
  static List<Color> getAccentColors() => List.unmodifiable(accentColors);

  // Extended palette with more options for color picker
  static const List<Color> extendedPalette = [
    Color(0xFF6750A4), // Purple
    Color(0xFF0B57D0), // Blue
    Color(0xFF006B5D), // Teal
    Color(0xFFB3261E), // Red
    Color(0xFF7D5700), // Orange/Gold
    Color(0xFF9333EA), // Violet
    Color(0xFF14B8A6), // Cyan
    Color(0xFF16A34A), // Green
    Color(0xFFD97706), // Amber
    Color(0xFFDC2626), // Bright Red
    Color(0xFF2563EB), // Bright Blue
    Color(0xFF10B981), // Emerald
  ];

  // Get extended palette for color picker
  static List<Color> getExtendedPalette() => List.unmodifiable(extendedPalette);

  static ThemeData getLightTheme({Color? accentColor}) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: accentColor ?? const Color(0xFF6750A4),
        brightness: Brightness.light,
      ),
      textTheme: GoogleFonts.interTextTheme(),
      cardTheme: CardTheme(
        elevation: 1,
        shadowColor: Colors.black.withOpacity(0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(8),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 2,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: false,
      ),
    );
  }

  static ThemeData getDarkTheme({Color? accentColor}) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: accentColor ?? const Color(0xFF6750A4),
        brightness: Brightness.dark,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
      cardTheme: CardTheme(
        elevation: 2,
        shadowColor: Colors.black.withOpacity(0.3),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(8),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 2,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: false,
      ),
    );
  }
}
