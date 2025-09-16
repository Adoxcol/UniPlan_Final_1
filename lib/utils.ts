import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Time utilities: convert HH:MM to minutes and back
export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map((v) => parseInt(v, 10));
  return h * 60 + (isNaN(m) ? 0 : m);
}

export function minutesToTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
}

// Clipboard utilities with fallback support
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Clipboard functionality not available in server environment');
  }

  // Try modern Clipboard API first (requires HTTPS or localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      console.warn('Clipboard API failed, falling back to legacy method:', error);
    }
  }

  // Fallback to legacy method using document.execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (!successful) {
      throw new Error('Legacy copy method failed');
    }
  } catch (error) {
    // If all methods fail, provide the text for manual copying
    throw new Error(`Unable to copy automatically. Please copy this text manually: ${text}`);
  }
}
