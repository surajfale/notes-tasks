/**
 * Create a base icon for the Notes & Tasks app
 * This creates a simple, clean 512x512 icon that will be used to generate all PWA icons
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_FILE = join(__dirname, 'static', 'favicon.png');

async function createBaseIcon() {
  console.log('🎨 Creating base icon for Notes & Tasks app...\n');

  // Create a 512x512 icon with a gradient background and a simple notepad/checklist design
  const size = 512;
  const padding = 80;
  const iconSize = size - (padding * 2);

  // Create SVG for the icon
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Gradient background -->
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
          <feOffset dx="0" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Rounded rectangle background -->
      <rect width="${size}" height="${size}" rx="110" fill="url(#grad)"/>
      
      <!-- White notepad/document shape -->
      <g filter="url(#shadow)">
        <!-- Main document -->
        <rect x="${padding + 40}" y="${padding}" width="${iconSize - 80}" height="${iconSize}" 
              rx="20" fill="white" opacity="0.95"/>
        
        <!-- Folded corner -->
        <path d="M ${size - padding - 40 - 60} ${padding} 
                 L ${size - padding - 40} ${padding + 60} 
                 L ${size - padding - 40} ${padding} Z" 
              fill="#e0e7ff" opacity="0.8"/>
        
        <!-- Lines representing text -->
        <rect x="${padding + 80}" y="${padding + 100}" width="${iconSize - 160}" height="12" 
              rx="6" fill="#6366f1" opacity="0.6"/>
        <rect x="${padding + 80}" y="${padding + 140}" width="${iconSize - 200}" height="12" 
              rx="6" fill="#6366f1" opacity="0.4"/>
        
        <!-- Checkboxes -->
        <rect x="${padding + 80}" y="${padding + 200}" width="40" height="40" 
              rx="8" fill="none" stroke="#6366f1" stroke-width="6"/>
        <rect x="${padding + 80}" y="${padding + 270}" width="40" height="40" 
              rx="8" fill="none" stroke="#6366f1" stroke-width="6"/>
        
        <!-- Checkmark in first checkbox -->
        <path d="M ${padding + 90} ${padding + 220} 
                 L ${padding + 100} ${padding + 230} 
                 L ${padding + 115} ${padding + 210}" 
              fill="none" stroke="#6366f1" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Lines next to checkboxes -->
        <rect x="${padding + 140}" y="${padding + 210}" width="${iconSize - 240}" height="12" 
              rx="6" fill="#6366f1" opacity="0.4"/>
        <rect x="${padding + 140}" y="${padding + 280}" width="${iconSize - 200}" height="12" 
              rx="6" fill="#6366f1" opacity="0.3"/>
      </g>
    </svg>
  `;

  try {
    await sharp(Buffer.from(svg))
      .png({
        compressionLevel: 9,
        quality: 100
      })
      .toFile(OUTPUT_FILE);

    console.log('✅ Base icon created successfully!');
    console.log('📁 Location:', OUTPUT_FILE);
    console.log('📐 Size: 512x512 pixels\n');
    console.log('Next step: Run "node generate-pwa-icons.js" to create all PWA icons');
  } catch (error) {
    console.error('❌ Error creating base icon:', error.message);
    process.exit(1);
  }
}

createBaseIcon();
