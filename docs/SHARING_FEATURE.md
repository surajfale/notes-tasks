# WhatsApp Sharing Feature

## Overview

The WhatsApp sharing feature allows users to share their notes in two formats:
1. **Formatted Text**: WhatsApp-friendly plain text with proper structure
2. **PNG Image**: Beautiful card-style images of notes

All processing happens client-side in the browser - no server uploads required.

## Quick Start

### From Note Detail Page
1. Open any note
2. Click the "Share" button (next to Copy button)
3. Choose "Share as Text" or "Share as Image"
4. WhatsApp opens with your note ready to share

### From Note Card
1. Find your note on the Notes page
2. Click "Share" in the action row
3. Choose your preferred format
4. Share via WhatsApp

## Features

### Text Sharing
- Converts markdown to WhatsApp-native formatting
- Preserves structure with Unicode characters
- Includes title, content, and tags
- Opens WhatsApp Web (desktop) or Share dialog (mobile)

### Image Sharing
- Generates 1200px wide PNG at 2x resolution
- Theme-aware (respects light/dark mode)
- Professional layout with title, content, tags, timestamp
- Uses Web Share API on mobile
- Auto-downloads on desktop

### Modal Features
- Live preview of note
- Two share options side-by-side
- Collapsible text preview
- Clear instructions for mobile vs desktop
- Error handling with user-friendly messages

## Technical Implementation

### Architecture
```
User Action → ShareModal → Share Utilities → Platform API
                  ↓
            NotePreview → Image Generator → PNG Blob
```

### Key Components

**ShareModal** (`frontend/src/lib/components/ui/ShareModal.svelte`)
- Main sharing interface
- Handles user interaction
- Manages share workflow

**NotePreview** (`frontend/src/lib/components/notes/NotePreview.svelte`)
- Renders note as shareable card
- Styled for both preview and export
- Supports theme switching

**Share Utils** (`frontend/src/lib/utils/share.ts`)
- Markdown to WhatsApp text conversion
- Web Share API integration
- Platform detection and fallbacks

**Image Generator** (`frontend/src/lib/utils/imageGenerator.ts`)
- DOM to PNG conversion using html-to-image
- Theme-aware background colors
- High-quality rendering

### Dependencies
- `html-to-image@^1.11.11` - Client-side image generation
- Web Share API (native browser API)
- Canvas API (native browser API)

## Text Format Conversion

### Markdown → WhatsApp

| Markdown | WhatsApp Output |
|----------|----------------|
| `**bold**` | `*bold*` |
| `*italic*` | `_italic_` |
| `# Heading` | `HEADING` (caps) |
| `- List` | `• List` (bullet) |
| `[Link](url)` | `Link (url)` |
| `` `code` `` | `` `code` `` |

### Example Transformation

**Input (Markdown):**
```markdown
# Project Update

## Completed Tasks
- Implemented **authentication**
- Fixed *critical bugs*
- Updated [documentation](https://example.com)

Tags: work, important
```

**Output (WhatsApp Text):**
```
*Project Update*
━━━━━━━━━━━━━━

COMPLETED TASKS

• Implemented *authentication*
• Fixed _critical bugs_
• Updated documentation (https://example.com)

🏷️ work, important
```

## Image Generation

### Process Flow
1. User clicks "Share as Image"
2. NotePreview component rendered off-screen
3. html-to-image captures DOM as PNG
4. Theme background color applied
5. Blob created from PNG data
6. Web Share API invoked or file downloaded

### Image Specifications
- **Width**: 1200px
- **Pixel Ratio**: 2x (for retina displays)
- **Quality**: 0.95 (95%)
- **Format**: PNG
- **Theme**: Matches current app theme
- **Content**: Title, body, tags, timestamp, branding

### Styling
- Title: 4xl font, bold, primary color underline
- Body: lg font, markdown rendered
- Tags: Color-coded badges
- Footer: Timestamp + app branding
- Border: 2px solid with theme colors
- Shadow: 2xl shadow for depth

## Platform Support

### Mobile Devices

**Android (Chrome)**
- ✅ Full Web Share API support
- ✅ Share to any app (WhatsApp, Telegram, etc.)
- ✅ Image sharing via Web Share API
- ✅ Text sharing via Web Share API

**iOS (Safari)**
- ✅ Full Web Share API support
- ✅ Share sheet with all apps
- ✅ Image sharing via Web Share API
- ✅ Text sharing via Web Share API

### Desktop Browsers

**Chrome/Edge**
- ⚠️ Limited Web Share API support
- ✅ WhatsApp Web link for text
- ✅ Auto-download for images
- ✅ Fallback to direct methods

**Firefox**
- ⚠️ No Web Share API support
- ✅ WhatsApp Web link for text
- ✅ Auto-download for images

**Safari (macOS)**
- ⚠️ Limited Web Share API support
- ✅ WhatsApp Web link for text
- ✅ Auto-download for images

## Privacy & Security

### Client-Side Processing
- ✅ No server uploads
- ✅ No data storage on servers
- ✅ No tracking or analytics
- ✅ All processing in browser
- ✅ No third-party services (except WhatsApp)

### Data Handling
- Images generated in browser memory
- Blobs created temporarily
- Cleaned up after sharing
- No persistent storage
- User controls all sharing actions

## Browser Requirements

### Minimum Versions
- Chrome 89+ (March 2021)
- Safari 14+ (September 2020)
- Firefox 88+ (April 2021)
- Edge 89+ (March 2021)

### Required APIs
- Canvas API (for image generation)
- Blob API (for image data)
- Web Share API (optional, for enhanced mobile sharing)
- File API (for image download fallback)

## Performance

### Text Sharing
- **Time**: Instant (<100ms)
- **Memory**: Minimal
- **Network**: Opens WhatsApp only

### Image Sharing
- **Time**: 2-5 seconds (generation + sharing)
- **Memory**: ~5-10 MB during generation
- **Network**: None (except WhatsApp opening)
- **File Size**: 500 KB - 2 MB typical

### Optimization
- 2x pixel ratio for quality
- Efficient canvas rendering
- Automatic cleanup
- Lazy loading of html-to-image

## User Experience

### Success Flow (Mobile)
1. Click Share → Modal opens (0s)
2. Preview renders instantly (0s)
3. Choose format → Click button (user action)
4. Processing/generation (0-3s)
5. Share dialog appears (0s)
6. Select WhatsApp → Pre-filled (0s)
7. Choose recipient → Send (user action)

### Success Flow (Desktop)
1. Click Share → Modal opens (0s)
2. Preview renders instantly (0s)
3. Choose format → Click button (user action)
4. Processing (0-3s)
5. WhatsApp Web opens OR Image downloads (1s)
6. Manual sharing in WhatsApp (user action)

### Error Handling
- Image generation failure → Clear error message + retry option
- Share cancellation → Silent (expected user action)
- Browser incompatibility → Fallback to download
- Network issues → Offline indicator + retry

## Testing

### Manual Testing Checklist

**Text Sharing**
- [ ] Share from note detail page
- [ ] Share from note card
- [ ] Verify formatting preserved
- [ ] Test on mobile (Android/iOS)
- [ ] Test on desktop (Chrome/Firefox)
- [ ] Verify WhatsApp opens correctly

**Image Sharing**
- [ ] Share from note detail page
- [ ] Share from note card
- [ ] Verify image quality
- [ ] Test light mode images
- [ ] Test dark mode images
- [ ] Test with long notes
- [ ] Test with various markdown
- [ ] Verify download on desktop
- [ ] Verify Web Share on mobile

**Edge Cases**
- [ ] Empty note body
- [ ] Very long notes (>10,000 chars)
- [ ] Notes with special characters
- [ ] Notes with emojis
- [ ] Notes without tags
- [ ] Archived notes
- [ ] Notes with complex markdown

## Troubleshooting

### Common Issues

**"Failed to generate image"**
- Check browser compatibility
- Simplify note content
- Try different theme
- Clear browser cache

**Share doesn't open WhatsApp**
- Verify WhatsApp installed (mobile)
- Check WhatsApp Web logged in (desktop)
- Allow popups for the site
- Try text sharing instead

**Image quality poor**
- Use Chrome/Edge for best results
- Ensure high-resolution display
- Check image exported at 2x ratio
- Try lighter theme

**Text formatting lost**
- WhatsApp limitation
- Use image sharing for guaranteed formatting
- Keep markdown simple

## Future Enhancements

### Potential Features
- Share to other platforms (Telegram, Slack, Email)
- Customize image templates
- Batch sharing multiple notes
- Share tasks in addition to notes
- Export as PDF
- Share entire lists
- Add watermark options
- Custom branding

### Technical Improvements
- WebP format support for smaller files
- Progressive image loading
- Share history tracking
- Offline queue for shares
- Image caching for repeated shares

## Code Examples

### Using Share Modal in Components

```svelte
<script lang="ts">
  import ShareModal from '$lib/components/ui/ShareModal.svelte';
  import type { Note } from '$lib/types/note';

  let showShareModal = false;
  let note: Note = { /* note data */ };

  function openShare() {
    showShareModal = true;
  }

  function closeShare() {
    showShareModal = false;
  }
</script>

<button on:click={openShare}>Share</button>

<ShareModal
  bind:open={showShareModal}
  {note}
  onClose={closeShare}
/>
```

### Custom Image Generation

```typescript
import { elementToBlob, getCurrentTheme, getThemeBackgroundColor } from '$lib/utils/imageGenerator';

async function generateCustomImage(element: HTMLElement) {
  const theme = getCurrentTheme();
  const backgroundColor = getThemeBackgroundColor(theme);
  
  const blob = await elementToBlob(element, {
    backgroundColor,
    width: 1200,
    quality: 0.95,
    pixelRatio: 2
  });
  
  return blob;
}
```

### Text Formatting

```typescript
import { formatNoteForWhatsApp, shareText } from '$lib/utils/share';

const formatted = formatNoteForWhatsApp(
  note.title,
  note.body,
  note.tags
);

await shareText(formatted, note.title);
```

## Resources

### Documentation
- [USAGE.md](./USAGE.md) - User guide with sharing instructions
- [README.md](../README.md) - Project overview
- [CHANGELOG.md](../CHANGELOG.md) - Version history

### External Resources
- [html-to-image Documentation](https://github.com/bubkoo/html-to-image)
- [Web Share API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [WhatsApp URL Scheme](https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat)

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [USAGE.md](./USAGE.md) for detailed instructions
3. Check browser compatibility
4. Verify all dependencies installed
5. Review browser console for errors
