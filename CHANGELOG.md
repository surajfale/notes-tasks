# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 2025-11-23 - [UNRELEASED]

feat(sharing): add WhatsApp sharing functionality for notes

- Implement share notes as formatted text or PNG images
- Add ShareModal component with preview and share options
- Create NotePreview component for generating shareable cards
- Add share utilities for text formatting and image generation
- Support Web Share API on mobile with fallback to direct links
- Add share buttons to note detail page and note cards
- Add size prop support to Modal component (sm/md/lg/xl)
- Install html-to-image library for client-side image generation
- Update documentation with comprehensive sharing guide
- Theme-aware image generation respecting light/dark mode
- Privacy-first approach with all processing happening client-side

### 2025-11-05 23:48:32 - 01670a3 [PUSHED]

feat(ai): add AI content enhancement feature for notes and tasks

- Implement AI-powered content enhancement using Ollama Cloud
- Introduce customizable tone styles for enhanced content
- Add new API endpoint for content enhancement
- Update README and documentation for AI features
- Modify task model to support checklist items and enhancements### 2025-10-31 01:04:35 - 910bfe6 [PUSHED]

feat(pwa): implement Progressive Web App features and icon generation

- Added PWA support with service worker and manifest
- Created scripts for generating app icons
- Updated documentation for installation and features
- Enhanced README with PWA details
- Included dynamic theme color management component### 2025-10-29 23:02:32 - 36f9605 [PUSHED]

feat(ui): enhance Markdown editor and renderer functionality

- Improved text formatting options in MarkdownEditor
- Added support for custom date formatting in date utility
- Updated MarkdownRenderer to handle new formatting features### 2025-10-21 22:29:24 - f8d6760 [LOCAL]

### 2025-10-19 14:08:59 - 7c9ed27 [PUSHED]

docs: Update documentation

- Update CHANGELOG.md### 2025-10-19 14:08:18 - 7d3dfdf [PUSHED]

docs: Update documentation

- Add CHANGELOG.md
- Remove CHANGELOG.md### 2025-10-19 14:07:06 - 4d54c89 [LOCAL]

docs(.kiro): Update documentation

- Add context7.md
- Add product.md
- Add structure.md
- Add tech.md