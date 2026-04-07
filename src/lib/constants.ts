import type { Part } from '../types';

/**
 * 파트별 색상/라벨 정보. 인라인 hex 코드를 직접 쓰지 말고 여기서 참조하세요.
 * bg / text: inline style용 rgba/hex 값 (동적 색상이라 Tailwind 클래스 불가)
 */
export const PART_INFO: Record<Part, { label: string; bg: string; text: string }> = {
  vocal:    { label: 'VOCAL',    bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899' },
  guitar:   { label: 'GUITAR',   bg: 'rgba(59, 130, 246, 0.15)',  text: '#3b82f6' },
  drum:     { label: 'DRUM',     bg: 'rgba(239, 68, 68, 0.15)',   text: '#ef4444' },
  bass:     { label: 'BASS',     bg: 'rgba(16, 185, 129, 0.15)',  text: '#10b981' },
  keyboard: { label: 'KEYBOARD', bg: 'rgba(245, 158, 11, 0.15)',  text: '#f59e0b' },
};

export const PURPOSES = ['합주', '강습', '정기회의'] as const;
