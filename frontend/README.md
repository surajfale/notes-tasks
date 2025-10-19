# Notes & Tasks Frontend

Flutter web application for managing notes and tasks with modern state management.

## Tech Stack

- **Flutter SDK**: 3.x
- **State Management**: Riverpod 3.0 with code generation
- **HTTP Client**: dio 5.4
- **Navigation**: go_router 16.2
- **Code Generation**: Freezed 3.2, json_serializable 6.11
- **UI Components**: flutter_slidable 4.0

## Getting Started

1. **Install dependencies**:
```bash
flutter pub get
```

2. **Generate code** (for Freezed models and Riverpod providers):
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

3. **Run the app**:
```bash
flutter run -d chrome
```

## Project Structure

```
lib/
├── core/
│   ├── api/              # HTTP client configuration
│   ├── config/           # App configuration
│   ├── models/           # Shared data models (Freezed)
│   ├── storage/          # Local storage (JWT tokens)
│   └── theme/            # App theming
├── features/
│   ├── auth/             # Authentication feature
│   ├── home/             # Main navigation
│   ├── notes/            # Notes management
│   └── tasks/            # Tasks management
└── main.dart             # App entry point
```

## Key Features

- ✅ JWT Authentication
- ✅ Notes with tags and search
- ✅ Tasks with priorities and due dates
- ✅ Responsive design
- ✅ Multiple color themes
- ✅ Swipe actions (delete, edit)

## Development

### Code Generation

Run after changing models or providers:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

Watch mode (auto-generates on save):
```bash
flutter pub run build_runner watch
```

### Testing

```bash
flutter test
```

### Code Analysis

```bash
flutter analyze
```

## Recent Updates (2025)

### Dependencies Upgraded
- Riverpod 2.6 → 3.0 (with breaking changes)
- go_router 13.2 → 16.2
- Freezed 2.5 → 3.2
- flutter_slidable 3.1 → 4.0
- flutter_lints 4.0 → 6.0

### Breaking Changes Fixed
- Migrated from `StateNotifier` to `Notifier` with `@riverpod` annotation
- Updated all providers to use code generation
- Fixed `withOpacity()` deprecations (replaced with `withValues(alpha:)`)
- Fixed Freezed 3.0 `@JsonKey` syntax
- Fixed async context gaps

## Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Riverpod Documentation](https://riverpod.dev/)
- [Freezed Documentation](https://pub.dev/packages/freezed)
