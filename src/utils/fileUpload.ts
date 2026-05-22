const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const SAFE_IMAGE_EXTENSIONS = new Set(['gif', 'jpeg', 'jpg', 'png', 'webp']);

export function validateImageFile(file: File, maxBytes = DEFAULT_MAX_IMAGE_BYTES): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }

  if (file.size > maxBytes) {
    throw new Error(`파일 크기는 ${formatMegabytes(maxBytes)}MB 이하여야 합니다.`);
  }
}

export function getSafeImageExtension(file: File): string {
  const mimeExtension = MIME_EXTENSION_MAP[file.type];
  if (mimeExtension) {
    return mimeExtension;
  }

  const filenameExtension = file.name.split('.').pop()?.toLowerCase();
  if (filenameExtension && SAFE_IMAGE_EXTENSIONS.has(filenameExtension)) {
    return filenameExtension === 'jpeg' ? 'jpg' : filenameExtension;
  }

  return 'jpg';
}

function formatMegabytes(bytes: number): number {
  return Math.floor(bytes / 1024 / 1024);
}
