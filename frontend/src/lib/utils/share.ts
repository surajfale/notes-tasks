// Share utility functions for WhatsApp sharing

/**
 * Convert markdown to WhatsApp-friendly formatted text
 * Preserves structure using Unicode characters and spacing
 */
export function markdownToWhatsAppText(markdown: string): string {
  let text = markdown;
  
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
 * Share image via Web Share API or download
 */
export async function shareImage(blob: Blob, filename: string, title?: string): Promise<void> {
  if (isWebShareSupported() && navigator.canShare) {
    const file = new File([blob], filename, { type: 'image/png' });
    
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: title || 'Share Note',
          files: [file]
        });
        return;
      } catch (error: any) {
        // User cancelled or error occurred, fall back to download
        if (error.name !== 'AbortError') {
          console.error('Web Share API error:', error);
        }
      }
    }
  }
  
  // Fallback: Download the image
  downloadBlob(blob, filename);
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
