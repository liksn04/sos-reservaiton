import type {
  MembershipFeeMemberStatus,
  MembershipFeePolicyInput,
  MembershipFeeRecord,
} from '../types';

interface MembershipFeeProfileRow {
  id: string;
  display_name: string | null;
}

interface MembershipFeePolicyDraft {
  amountText: string;
  dueDate: string;
  note: string;
}

function normalizeDisplayName(displayName: string | null) {
  const trimmed = displayName?.trim() ?? '';
  return trimmed || '이름 미설정';
}

export function buildMembershipFeeMemberStatuses(params: {
  policyId: string | null;
  profiles: MembershipFeeProfileRow[];
  records: MembershipFeeRecord[];
}) {
  const recordsByUserId = new Map(params.records.map((record) => [record.user_id, record]));

  return params.profiles.map<MembershipFeeMemberStatus>((profile) => {
    const matchedRecord = recordsByUserId.get(profile.id);

    return {
      userId: profile.id,
      displayName: normalizeDisplayName(profile.display_name),
      policyId: params.policyId,
      recordId: matchedRecord?.id ?? null,
      isPaid: matchedRecord?.is_paid ?? false,
      paidAt: matchedRecord?.paid_at ?? null,
      amountPaid: matchedRecord?.amount_paid ?? null,
      note: matchedRecord?.note ?? null,
    };
  });
}

export function validateMembershipFeePolicyDraft(draft: MembershipFeePolicyDraft) {
  const trimmedAmount = draft.amountText.trim();
  const trimmedNote = draft.note.trim();

  if (!trimmedAmount) {
    return '회비 금액을 입력해주세요.';
  }

  const parsedAmount = Number.parseInt(trimmedAmount, 10);
  if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
    return '회비 금액은 1원 이상의 정수여야 합니다.';
  }

  if (parsedAmount > 1_000_000_000) {
    return '회비 금액이 너무 큽니다.';
  }

  // Edge case: 브라우저가 비정상 값을 전달하면 잘못된 날짜 문자열이 들어올 수 있음
  if (draft.dueDate) {
    const dueDate = new Date(`${draft.dueDate}T00:00:00`);
    if (Number.isNaN(dueDate.getTime())) {
      return '마감일 형식이 올바르지 않습니다.';
    }
  }

  // Edge case: 긴 자유 입력 메모는 DB/UI에서 잘리거나 레이아웃을 깨뜨릴 수 있음
  if (trimmedNote.length > 200) {
    return '정책 메모는 200자 이하여야 합니다.';
  }

  return null;
}

export function sanitizeMembershipFeePolicyDraft(draft: MembershipFeePolicyDraft): MembershipFeePolicyInput {
  return {
    amount: Number.parseInt(draft.amountText.trim(), 10),
    due_date: draft.dueDate || null,
    note: draft.note.trim() || null,
  };
}
