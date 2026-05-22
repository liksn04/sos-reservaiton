import { describe, expect, it } from 'vitest';
import { diffDaysBetween, formatKoreanDate } from './dateLabels';

describe('dateLabels', () => {
  it('formatKoreanDate renders year/month/day/weekday in Korean', () => {
    const label = formatKoreanDate('2026-05-22');
    expect(label).toContain('2026');
    expect(label).toContain('5월');
    expect(label).toContain('22');
  });

  it('diffDaysBetween returns positive for future dates', () => {
    expect(diffDaysBetween('2026-05-25', '2026-05-22')).toBe(3);
  });

  it('diffDaysBetween returns negative for past dates', () => {
    expect(diffDaysBetween('2026-05-19', '2026-05-22')).toBe(-3);
  });

  it('diffDaysBetween returns 0 for the same date', () => {
    expect(diffDaysBetween('2026-05-22', '2026-05-22')).toBe(0);
  });
});
