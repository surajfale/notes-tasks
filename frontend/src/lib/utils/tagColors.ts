/**
 * Tag color utilities
 * Generates consistent colors for tags based on their names
 */

// Predefined color palette for tags and cards
const TAG_COLORS = [
  { 
    bg: 'bg-blue-100 dark:bg-blue-900/30', 
    text: 'text-blue-700 dark:text-blue-300', 
    border: 'border-blue-300 dark:border-blue-700',
    cardBg: 'bg-blue-50/50 dark:bg-blue-950/20'
  },
  { 
    bg: 'bg-green-100 dark:bg-green-900/30', 
    text: 'text-green-700 dark:text-green-300', 
    border: 'border-green-300 dark:border-green-700',
    cardBg: 'bg-green-50/50 dark:bg-green-950/20'
  },
  { 
    bg: 'bg-purple-100 dark:bg-purple-900/30', 
    text: 'text-purple-700 dark:text-purple-300', 
    border: 'border-purple-300 dark:border-purple-700',
    cardBg: 'bg-purple-50/50 dark:bg-purple-950/20'
  },
  { 
    bg: 'bg-pink-100 dark:bg-pink-900/30', 
    text: 'text-pink-700 dark:text-pink-300', 
    border: 'border-pink-300 dark:border-pink-700',
    cardBg: 'bg-pink-50/50 dark:bg-pink-950/20'
  },
  { 
    bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
    text: 'text-yellow-700 dark:text-yellow-300', 
    border: 'border-yellow-300 dark:border-yellow-700',
    cardBg: 'bg-yellow-50/50 dark:bg-yellow-950/20'
  },
  { 
    bg: 'bg-orange-100 dark:bg-orange-900/30', 
    text: 'text-orange-700 dark:text-orange-300', 
    border: 'border-orange-300 dark:border-orange-700',
    cardBg: 'bg-orange-50/50 dark:bg-orange-950/20'
  },
  { 
    bg: 'bg-red-100 dark:bg-red-900/30', 
    text: 'text-red-700 dark:text-red-300', 
    border: 'border-red-300 dark:border-red-700',
    cardBg: 'bg-red-50/50 dark:bg-red-950/20'
  },
  { 
    bg: 'bg-indigo-100 dark:bg-indigo-900/30', 
    text: 'text-indigo-700 dark:text-indigo-300', 
    border: 'border-indigo-300 dark:border-indigo-700',
    cardBg: 'bg-indigo-50/50 dark:bg-indigo-950/20'
  },
  { 
    bg: 'bg-teal-100 dark:bg-teal-900/30', 
    text: 'text-teal-700 dark:text-teal-300', 
    border: 'border-teal-300 dark:border-teal-700',
    cardBg: 'bg-teal-50/50 dark:bg-teal-950/20'
  },
  { 
    bg: 'bg-cyan-100 dark:bg-cyan-900/30', 
    text: 'text-cyan-700 dark:text-cyan-300', 
    border: 'border-cyan-300 dark:border-cyan-700',
    cardBg: 'bg-cyan-50/50 dark:bg-cyan-950/20'
  },
  { 
    bg: 'bg-lime-100 dark:bg-lime-900/30', 
    text: 'text-lime-700 dark:text-lime-300', 
    border: 'border-lime-300 dark:border-lime-700',
    cardBg: 'bg-lime-50/50 dark:bg-lime-950/20'
  },
  { 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-700 dark:text-amber-300', 
    border: 'border-amber-300 dark:border-amber-700',
    cardBg: 'bg-amber-50/50 dark:bg-amber-950/20'
  },
];

/**
 * Simple hash function to convert string to number
 * @param str - String to hash
 * @returns Hash number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get consistent color classes for a tag based on its name
 * @param tagName - Name of the tag
 * @returns Object with background, text, border, and card background color classes
 */
export function getTagColor(tagName: string): { bg: string; text: string; border: string; cardBg?: string } {
  const hash = hashString(tagName.toLowerCase());
  const colorIndex = hash % TAG_COLORS.length;
  return TAG_COLORS[colorIndex];
}

/**
 * Get all unique tags from an array of items (notes or tasks)
 * @param items - Array of items with tags property
 * @returns Array of unique tag names
 */
export function getUniqueTags(items: Array<{ tags?: string[] }>): string[] {
  const tagSet = new Set<string>();
  
  items.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => {
        if (tag && tag.trim()) {
          tagSet.add(tag.trim());
        }
      });
    }
  });
  
  return Array.from(tagSet).sort();
}

/**
 * Get tag color as inline style (for dynamic colors)
 * @param tagName - Name of the tag
 * @returns Object with CSS color values
 */
export function getTagColorStyle(tagName: string): { backgroundColor: string; color: string; borderColor: string } {
  // Predefined hex colors matching the Tailwind palette
  const COLORS = [
    { backgroundColor: '#DBEAFE', color: '#1E40AF', borderColor: '#93C5FD' }, // blue
    { backgroundColor: '#D1FAE5', color: '#065F46', borderColor: '#6EE7B7' }, // green
    { backgroundColor: '#E9D5FF', color: '#6B21A8', borderColor: '#C084FC' }, // purple
    { backgroundColor: '#FCE7F3', color: '#9F1239', borderColor: '#F9A8D4' }, // pink
    { backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#FCD34D' }, // yellow
    { backgroundColor: '#FFEDD5', color: '#9A3412', borderColor: '#FDBA74' }, // orange
    { backgroundColor: '#FEE2E2', color: '#991B1B', borderColor: '#FCA5A5' }, // red
    { backgroundColor: '#E0E7FF', color: '#3730A3', borderColor: '#A5B4FC' }, // indigo
    { backgroundColor: '#CCFBF1', color: '#115E59', borderColor: '#5EEAD4' }, // teal
    { backgroundColor: '#CFFAFE', color: '#155E75', borderColor: '#67E8F9' }, // cyan
    { backgroundColor: '#ECFCCB', color: '#3F6212', borderColor: '#BEF264' }, // lime
    { backgroundColor: '#FEF3C7', color: '#78350F', borderColor: '#FCD34D' }, // amber
  ];
  
  const hash = hashString(tagName.toLowerCase());
  const colorIndex = hash % COLORS.length;
  return COLORS[colorIndex];
}
