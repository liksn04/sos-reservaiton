import { describe, expect, it } from 'vitest';
import {
  buildMembershipFeeMemberStatuses,
  sanitizeMembershipFeePolicyDraft,
  validateMembershipFeePolicyDraft,
} from './membershipFees';
import type { MembershipFeeRecord } from '../types';

function createRecord(overrides: Partial<MembershipFeeRecord> = {}): MembershipFeeRecord {
  return {
    id: overrides.id ?? 'record-1',
    policy_id: overrides.policy_id ?? 'policy-1',
    user_id: overrides.user_id ?? 'user-1',
    paid_at: overrides.paid_at ?? '2026-04-20T10:00:00.000Z',
    amount_paid: overrides.amount_paid ?? 30000,
    is_paid: overrides.is_paid ?? true,
    note: overrides.note ?? '납부 완료',
    profile: overrides.profile,
  };
}

describe('membershipFees', () => {
  it('정책과 납부 기록을 회원 목록과 병합한다', () => {
    const statuses = buildMembershipFeeMemberStatuses({
      policyId: 'policy-1',
      profiles: [
        { id: 'user-1', display_name: '김철수' },
        { id: 'user-2', display_name: '이영희' },
      ],
      records: [createRecord()],
    });

    expect(statuses).toEqual([
      {
        userId: 'user-1',
        displayName: '김철수',
        policyId: 'policy-1',
        recordId: 'record-1',
        isPaid: true,
        paidAt: '2026-04-20T10:00:00.000Z',
        amountPaid: 30000,
        note: '납부 완료',
      },
      {
        userId: 'user-2',
        displayName: '이영희',
        policyId: 'policy-1',
        recordId: null,
        isPaid: false,
        paidAt: null,
        amountPaid: null,
        note: null,
      },
    ]);
  });

  it('정책이 없어도 기본 납부 상태를 안전하게 만든다', () => {
    const statuses = buildMembershipFeeMemberStatuses({
      policyId: null,
      profiles: [{ id: 'user-1', display_name: '   ' }],
      records: [],
    });

    expect(statuses[0]).toMatchObject({
      policyId: null,
      displayName: '이름 미설정',
      isPaid: false,
    });
  });

  it('회비 정책 입력값을 검증하고 정리한다', () => {
    expect(
      validateMembershipFeePolicyDraft({
        amountText: '0',
        dueDate: '',
        note: '',
      }),
    ).toBe('회비 금액은 1원 이상의 정수여야 합니다.');

    expect(
      validateMembershipFeePolicyDraft({
        amountText: '30000',
        dueDate: 'invalid-date',
        note: '',
      }),
    ).toBe('마감일 형식이 올바르지 않습니다.');

    expect(
      sanitizeMembershipFeePolicyDraft({
        amountText: ' 30000 ',
        dueDate: '2026-05-01',
        note: '  상반기 회비  ',
      }),
    ).toEqual({
      amount: 30000,
      due_date: '2026-05-01',
      note: '상반기 회비',
    });
  });
});
