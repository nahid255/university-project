export const isSafeUrl = (url?: string): boolean => {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed === '#') return true;
  if (trimmed.startsWith('/')) return true;

  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === 'https:' ||
      parsed.protocol === 'http:' ||
      parsed.protocol === 'blob:'
    );
  } catch {
    // Allow safe base64 image data URLs only (explicitly block data:text/html etc.)
    return /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i.test(trimmed);
  }
};

export const sanitizeUrl = (url?: string, fallback: string = '#'): string => {
  return isSafeUrl(url) ? (url as string).trim() : fallback;
};
