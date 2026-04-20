import { describe, expect, it } from 'vitest';
import { getAvailableReservationPurposes, PURPOSES } from './constants';

describe('getAvailableReservationPurposes', () => {
  it('비관리자에게는 오디션 목적을 숨긴다', () => {
    expect(getAvailableReservationPurposes(false)).toEqual(['합주', '강습', '정기회의']);
  });

  it('관리자에게는 모든 예약 목적을 노출한다', () => {
    expect(getAvailableReservationPurposes(true)).toEqual([...PURPOSES]);
  });

  it('현재 선택값이 오디션이면 비관리자 편집 화면에서도 옵션을 유지한다', () => {
    expect(getAvailableReservationPurposes(false, '오디션')).toEqual([...PURPOSES]);
  });
});
