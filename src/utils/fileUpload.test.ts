import { describe, expect, it } from 'vitest';
import { getSafeImageExtension, validateImageFile } from './fileUpload';

function makeFile(name: string, type: string, size: number): File {
  return new File(['x'.repeat(size)], name, { type });
}

describe('fileUpload utils', () => {
  it('accepts image files within the size limit', () => {
    const file = makeFile('receipt.png', 'image/png', 1024);

    expect(() => validateImageFile(file)).not.toThrow();
  });

  it('rejects non-image files', () => {
    const file = makeFile('receipt.pdf', 'application/pdf', 1024);

    expect(() => validateImageFile(file)).toThrow('이미지 파일만 업로드할 수 있습니다.');
  });

  it('rejects oversized image files', () => {
    const file = makeFile('receipt.jpg', 'image/jpeg', 6 * 1024 * 1024);

    expect(() => validateImageFile(file)).toThrow('파일 크기는 5MB 이하여야 합니다.');
  });

  it('normalizes safe image extensions', () => {
    expect(getSafeImageExtension(makeFile('profile.jpeg', 'image/jpeg', 1024))).toBe('jpg');
    expect(getSafeImageExtension(makeFile('banner.webp', 'image/webp', 1024))).toBe('webp');
    expect(getSafeImageExtension(makeFile('unknown', 'image/unknown', 1024))).toBe('jpg');
  });
});
