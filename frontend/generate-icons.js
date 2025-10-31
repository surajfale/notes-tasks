/**
 * Icon Generator Script
 * 
 * This script helps generate PWA icons in multiple sizes.
 * You can either:
 * 1. Use an online tool like https://realfavicongenerator.net/
 * 2. Use ImageMagick (if installed): node generate-icons.js
 * 3. Manually create icons using design software
 * 
 * Required icon sizes for PWA:
 * - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = path.join(__dirname, 'static', 'favicon.png');
const outputDir = path.join(__dirname, 'static');

// Check if ImageMagick is installed
function hasImageMagick() {
  try {
    execSync('magick -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Generate icons using ImageMagick
function generateIcons() {
  if (!hasImageMagick()) {
    console.log('❌ ImageMagick not found.');
    console.log('\nOptions to generate icons:');
    console.log('1. Install ImageMagick: https://imagemagick.org/script/download.php');
    console.log('2. Use online tool: https://realfavicongenerator.net/');
    console.log('3. Use https://www.pwabuilder.com/imageGenerator');
    console.log('4. Manually create icons in design software\n');
    console.log('Required sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512');
    return;
  }

  if (!fs.existsSync(sourceIcon)) {
    console.log('❌ Source icon not found:', sourceIcon);
    return;
  }

  console.log('🎨 Generating PWA icons...\n');

  sizes.forEach(size => {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
    try {
      execSync(`magick "${sourceIcon}" -resize ${size}x${size} "${outputFile}"`);
      console.log(`✅ Generated ${size}x${size} icon`);
    } catch (error) {
      console.log(`❌ Failed to generate ${size}x${size} icon:`, error.message);
    }
  });

  console.log('\n✨ Icon generation complete!');
}

generateIcons();
