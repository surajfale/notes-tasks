// Image generation utility using html-to-image

import { toPng } from 'html-to-image';

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  backgroundColor?: string;
  pixelRatio?: number;
}

/**
 * Convert a DOM element to PNG blob
 */
export async function elementToBlob(
  element: HTMLElement,
  options: ImageOptions = {}
): Promise<Blob> {
  const {
    width = 1200,
    quality = 0.95,
    backgroundColor,
    pixelRatio = 2
  } = options;

  try {
    // Generate PNG data URL
    const dataUrl = await toPng(element, {
      width,
      quality,
      backgroundColor,
      pixelRatio,
      cacheBust: true,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    });

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    return blob;
  } catch (error) {
    console.error('Failed to generate image:', error);
    throw new Error('Failed to generate image from note');
  }
}

/**
 * Generate a filename for the note image
 */
export function generateNoteImageFilename(noteTitle: string): string {
  // Sanitize title for filename
  const sanitized = noteTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  const timestamp = new Date().getTime();
  return `note-${sanitized}-${timestamp}.png`;
}

/**
 * Get current theme (light/dark) from document
 */
export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  
  const htmlElement = document.documentElement;
  return htmlElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Get theme-appropriate background color
 */
export function getThemeBackgroundColor(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? '#000000' : '#ffffff';
}
