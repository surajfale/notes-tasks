/**
 * PWA Icon Generator using Sharp
 * 
 * Generates all required PWA icons from the source favicon.png
 * Run with: node generate-pwa-icons.js
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Icon sizes required for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Paths
const SOURCE_ICON = join(__dirname, 'static', 'favicon.png');
const OUTPUT_DIR = join(__dirname, 'static');

async function generateIcons() {
  console.log('🎨 PWA Icon Generator\n');

  // Check if source icon exists
  if (!existsSync(SOURCE_ICON)) {
    console.error('❌ Error: Source icon not found at:', SOURCE_ICON);
    console.log('\nPlease ensure favicon.png exists in the static folder.');
    process.exit(1);
  }

  console.log('📁 Source icon:', SOURCE_ICON);
  console.log('📁 Output directory:', OUTPUT_DIR);
  console.log('');

  // Get source image metadata
  try {
    const metadata = await sharp(SOURCE_ICON).metadata();
    console.log(`✅ Source image: ${metadata.width}x${metadata.height} (${metadata.format})\n`);
  } catch (error) {
    console.error('❌ Error reading source image:', error.message);
    process.exit(1);
  }

  // Generate each icon size
  let successCount = 0;
  let errorCount = 0;

  for (const size of ICON_SIZES) {
    const outputFile = join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    
    try {
      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png({
          compressionLevel: 9,
          quality: 100
        })
        .toFile(outputFile);
      
      // Get file size
      const stats = await sharp(outputFile).metadata();
      const fileSize = stats.size ? `${(stats.size / 1024).toFixed(1)}KB` : 'unknown';
      
      console.log(`✅ Generated ${size}x${size} icon (${fileSize})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size} icon:`, error.message);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✨ Icon generation complete!`);
  console.log(`   Success: ${successCount}/${ICON_SIZES.length}`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount}`);
  }
  console.log('='.repeat(50));
  
  if (successCount === ICON_SIZES.length) {
    console.log('\n🎉 All icons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run build');
    console.log('2. Run: npm run preview');
    console.log('3. Test PWA installation at http://localhost:4173');
  } else {
    console.log('\n⚠️  Some icons failed to generate. Please check the errors above.');
    process.exit(1);
  }
}

// Run the generator
generateIcons().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
