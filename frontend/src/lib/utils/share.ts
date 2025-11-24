// Share utility functions for WhatsApp sharing

/**
 * Convert markdown tables to text format
 */
function convertMarkdownTable(table: string): string {
  const lines = table.trim().split('\n');
  if (lines.length < 2) return table;

  // Parse table rows
  const rows = lines.map(line =>
    line.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0)
  );

  // Skip separator line (usually second line with dashes)
  const hasHeaderSeparator = lines[1] && lines[1].includes('---');
  const dataRows = hasHeaderSeparator
    ? [rows[0], ...rows.slice(2)]
    : rows;

  if (dataRows.length === 0) return table;

  // Calculate column widths
  const columnCount = Math.max(...dataRows.map(row => row.length));
  const columnWidths: number[] = [];

  for (let col = 0; col < columnCount; col++) {
    const maxWidth = Math.max(
      ...dataRows.map(row => (row[col] || '').length),
      0
    );
    columnWidths.push(Math.min(maxWidth, 20)); // Cap at 20 chars
  }

  // Format table rows
  const formattedRows = dataRows.map((row, rowIndex) => {
    const cells = row.map((cell, colIndex) => {
      const width = columnWidths[colIndex] || 10;
      return cell.padEnd(width, ' ').substring(0, width);
    });

    const rowText = cells.join(' │ ');

    // Add separator after header
    if (rowIndex === 0 && hasHeaderSeparator) {
      const separator = columnWidths.map(w => '─'.repeat(w)).join('─┼─');
      return `${rowText}\n${separator}`;
    }

    return rowText;
  });

  return formattedRows.join('\n');
}

/**
 * Convert markdown to WhatsApp-friendly formatted text
 * Preserves structure using Unicode characters and spacing
 */
export function markdownToWhatsAppText(markdown: string): string {
  let text = markdown;

  // Convert tables first (before other processing)
  text = text.replace(/(\|.+\|[\r\n]+)+/g, (match) => {
    return '\n' + convertMarkdownTable(match) + '\n';
  });

  // Convert headers to uppercase with spacing
  text = text.replace(/^### (.+)$/gim, '\n$1\n');
  text = text.replace(/^## (.+)$/gim, '\n$1\n');
  text = text.replace(/^# (.+)$/gim, '\n$1\n\n');

  // Convert bold to *text* for WhatsApp bold formatting
  text = text.replace(/\*\*(.+?)\*\*/g, '*$1*');

  // Convert italic to _text_ for WhatsApp italic formatting
  text = text.replace(/\*(.+?)\*/g, '_$1_');

  // Convert inline code (keep backticks or add monospace)
  text = text.replace(/`(.+?)`/g, '`$1`');

  // Convert links to "text (url)"
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Convert unordered lists to bullet points
  text = text.replace(/^- /gim, '• ');

  // Convert ordered lists (keep numbers)
  // Already in good format, just ensure proper spacing

  return text.trim();
}

/**
 * Format note content for WhatsApp sharing
 */
export function formatNoteForWhatsApp(title: string, body: string, tags?: string[]): string {
  const separator = '━'.repeat(Math.min(title.length, 40));
  let content = `*${title}*\n${separator}\n\n`;
  
  // Add formatted body
  content += markdownToWhatsAppText(body);
  
  // Add tags if present
  if (tags && tags.length > 0) {
    content += `\n\n🏷️ ${tags.join(', ')}`;
  }
  
  return content;
}

/**
 * Generate WhatsApp share URL for text
 */
export function getWhatsAppShareUrl(text: string): string {
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if Web Share API is available
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Share text via Web Share API or fallback to WhatsApp URL
 */
export async function shareText(text: string, title?: string): Promise<void> {
  if (isWebShareSupported()) {
    try {
      await navigator.share({
        title: title || 'Share Note',
        text: text
      });
      return;
    } catch (error: any) {
      // User cancelled or error occurred, fall back to WhatsApp
      if (error.name !== 'AbortError') {
        console.error('Web Share API error:', error);
      }
    }
  }
  
  // Fallback: Open WhatsApp directly
  const whatsappUrl = getWhatsAppShareUrl(text);
  window.open(whatsappUrl, '_blank');
}

/**
 * Copy image to clipboard
 */
async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    return false;
  }

  try {
    const clipboardItem = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (error) {
    console.error('Clipboard error:', error);
    return false;
  }
}

/**
 * Share image via Web Share API or download
 */
export async function shareImage(blob: Blob, filename: string, title?: string): Promise<void> {
  const isMobile = isMobileDevice();

  // Try Web Share API with file support
  if (isWebShareSupported()) {
    const file = new File([blob], filename, { type: 'image/png' });

    // Check if browser supports sharing files
    const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });

    if (canShareFiles) {
      try {
        await navigator.share({
          title: title || 'Share Note',
          files: [file]
        });
        return;
      } catch (error: any) {
        // User cancelled - don't fallback
        if (error.name === 'AbortError') {
          throw new Error('Share cancelled');
        }
        console.error('Web Share API error:', error);
        // Continue to fallback methods
      }
    }
  }

  // Try copying to clipboard (works well on modern mobile browsers)
  const copiedToClipboard = await copyImageToClipboard(blob);
  if (copiedToClipboard) {
    throw new Error('Image copied to clipboard! You can now paste it in WhatsApp.');
  }

  // Final fallback: download the image
  downloadBlob(blob, filename);

  if (isMobile) {
    throw new Error('Image downloaded! Please open it from your downloads and share to WhatsApp.');
  } else {
    throw new Error('Image downloaded! You can now drag and drop it to WhatsApp Web.');
  }
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
