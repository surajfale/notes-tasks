# Flutter Web Setup Guide

This guide covers installing Flutter and setting up the frontend web application.

**Note**: If you already have Flutter installed and the frontend project exists, skip to the "Run Development Server" section.

## Install Flutter

### Windows Installation

1. **Download Flutter SDK**:
   - Go to https://docs.flutter.dev/get-started/install/windows
   - Download the Flutter SDK ZIP file
   - Extract to `C:\src\flutter` (or your preferred location)

2. **Update PATH**:
   - Search for "Environment Variables" in Windows
   - Edit "Path" in System Variables
   - Add: `C:\src\flutter\bin`
   - Click OK

3. **Verify Installation**:
   ```powershell
   flutter --version
   flutter doctor
   ```

4. **Enable Web Support**:
   ```powershell
   flutter config --enable-web
   flutter doctor
   ```

### Install Chrome (if not already installed)

Flutter web requires Chrome for development:
- Download from https://www.google.com/chrome/

## Create Flutter Project

```bash
cd C:\Users\suraj\MyWork\notes-tasks\main
flutter create --org com.notestasks --platforms web frontend
cd frontend
```

## Install Dependencies

Edit `frontend/pubspec.yaml` and add dependencies, then run:

```bash
flutter pub get
```

## Project Structure

```
frontend/
\u251c\u2500\u2500 lib/
\u2502   \u251c\u2500\u2500 core/
\u2502   \u2502   \u251c\u2500\u2500 api/              # HTTP client and API service
\u2502   \u2502   \u251c\u2500\u2500 config/           # App configuration
\u2502   \u2502   \u251c\u2500\u2500 storage/          # Local storage (IndexedDB)
\u2502   \u2502   \u251c\u2500\u2500 theme/            # App theme and styling
\u2502   \u2502   \u2514\u2500\u2500 utils/            # Utilities
\u2502   \u251c\u2500\u2500 features/
\u2502   \u2502   \u251c\u2500\u2500 auth/
\u2502   \u2502   \u2502   \u251c\u2500\u2500 data/         # API and models
\u2502   \u2502   \u2502   \u251c\u2500\u2500 presentation/  # UI screens
\u2502   \u2502   \u2502   \u2514\u2500\u2500 providers/     # Riverpod providers
\u2502   \u2502   \u251c\u2500\u2500 lists/
\u2502   \u2502   \u251c\u2500\u2500 notes/
\u2502   \u2502   \u2514\u2500\u2500 tasks/
\u2502   \u2514\u2500\u2500 main.dart
\u251c\u2500\u2500 web/
\u2502   \u251c\u2500\u2500 index.html
\u2502   \u2514\u2500\u2500 manifest.json
\u251c\u2500\u2500 test/
\u251c\u2500\u2500 pubspec.yaml
\u2514\u2500\u2500 README.md
```

## Run Development Server

For PowerShell (Windows):
```powershell
cd frontend
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run -d chrome
```

For Bash (Linux/Mac):
```bash
cd frontend
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run -d chrome
```

The app will open in Chrome at `http://localhost:8080` (or another port).

## Hot Reload

While the app is running:
- Press `r` in terminal for hot reload
- Press `R` for hot restart
- Press `q` to quit

## Build for Production

```bash
flutter build web --release
```

Output will be in `frontend/build/web/`

## Common Commands

```powershell
# Check Flutter setup
flutter doctor

# Get dependencies
flutter pub get

# Code generation (after model changes)
flutter pub run build_runner build --delete-conflicting-outputs

# Code generation (watch mode)
flutter pub run build_runner watch

# Run on Chrome
flutter run -d chrome

# Run on specific port
flutter run -d chrome --web-port=8080

# Build production
flutter build web --release

# Run tests
flutter test

# Format code
flutter format lib/

# Analyze code
flutter analyze
```

## Troubleshooting

### "Flutter command not found"
- Ensure Flutter bin directory is in PATH
- Restart terminal/PowerShell

### "No devices found"
- Enable web: `flutter config --enable-web`
- Install Chrome

### "Package not found"
- Run `flutter pub get`
- Check `pubspec.yaml` syntax

### CORS errors when calling API
- Ensure backend CORS_ORIGINS includes `http://localhost:8080`
- Check backend is running: `curl http://localhost:3000/health`
- Always use localhost for testing, not Railway URLs

## VS Code Setup (Optional but Recommended)

1. Install VS Code: https://code.visualstudio.com/
2. Install extensions:
   - Flutter
   - Dart
3. Open project: `code frontend/`
4. Press F5 to run with debugger

## Development Tips

- Use `flutter run -d chrome` for fastest development
- Hot reload (r) is instant for UI changes
- Use Flutter DevTools for debugging
- Check `flutter doctor` if issues arise

## Next Steps

After setup:
1. Configure API base URL in `lib/core/config/app_config.dart`
2. Test backend connection
3. Start with auth screens
4. Build out features incrementally
