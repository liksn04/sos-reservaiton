import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import type {
  BudgetTransactionInput,
  BudgetCategory,
  MembershipFeePolicy,
  MembershipFeePolicyInput,
} from '../../types';

// ── 영수증 이미지 업로드 헬퍼 ──────────────────────────────────────────
/**
 * Supabase 'receipts' 버킷에 영수증 파일을 업로드하고 public URL을 반환합니다.
 * Edge case: 확장자가 없는 파일 → 'jpg' 로폴백
 * Edge case: 업로드 실패 → Error throw (caller에서 처리)
 */
export async function uploadReceipt(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from('receipts').getPublicUrl(path).data.publicUrl;
}

export function useBudgetMutations() {
  const queryClient = useQueryClient();

  // 1. 거래 등록 (CREATE)
  const createTransaction = useMutation({
    mutationFn: async (input: BudgetTransactionInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('budget_transactions')
        .insert({
          ...input,
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.all });
    },
  });

  // 2. 거래 수정 (UPDATE)
  const updateTransaction = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<BudgetTransactionInput> }) => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.all });
    },
  });

  // 3. 거래 삭제 (DELETE)
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.all });
    },
  });

  // 4. 예산 카테고리 등록 (CREATE)
  const createCategory = useMutation({
    mutationFn: async (input: Pick<BudgetCategory, 'name' | 'type' | 'icon' | 'color'>) => {
      const { data, error } = await supabase
        .from('budget_categories')
        .insert({ ...input, is_default: false })
        .select()
        .single();
      if (error) throw error;
      return data as BudgetCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories });
    },
  });

  // 5. 예산 카테고리 삭제 (DELETE)
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      // Edge case: 해당 카테고리를 사용하는 거래 내역이 있을 경우 DB 제약으로 실패할 수 있음
      const { error } = await supabase
        .from('budget_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories });
    },
  });

  const upsertMembershipPolicy = useMutation({
    mutationFn: async ({
      year,
      half,
      input,
    }: {
      year: number;
      half: 1 | 2;
      input: MembershipFeePolicyInput;
    }) => {
      // Edge case: 잘못된 연도/학기 값이 들어오면 잘못된 정책이 생성될 수 있으므로 선제 차단
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw new Error('회계연도 값이 올바르지 않습니다.');
      }

      if (half !== 1 && half !== 2) {
        throw new Error('학기 값이 올바르지 않습니다.');
      }

      // Edge case: 0원/음수/소수 금액은 수납 로직과 합계 계산을 깨뜨리므로 정수 양수만 허용
      if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
        throw new Error('회비 금액은 1원 이상의 정수여야 합니다.');
      }

      // Edge case: 메모가 너무 길면 UI와 DB 저장 모두 불안정해질 수 있어 길이 제한
      if ((input.note?.length ?? 0) > 200) {
        throw new Error('정책 메모는 200자 이하여야 합니다.');
      }

      const { data, error } = await supabase
        .from('membership_fee_policies')
        .upsert({
          fiscal_year: year,
          fiscal_half: half,
          amount: input.amount,
          due_date: input.due_date,
          note: input.note,
        }, {
          onConflict: 'fiscal_year,fiscal_half',
        })
        .select()
        .single();

      if (error) throw error;
      return data as MembershipFeePolicy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.fees.all });
    },
  });

  const markMembershipPaid = useMutation({
    mutationFn: async ({
      userId,
      policyId,
      isPaid,
    }: {
      userId: string;
      policyId: string;
      isPaid: boolean;
    }) => {
      // Edge case: 정책 없이 토글하면 orphan 레코드 또는 런타임 오류가 생길 수 있어 즉시 차단
      if (!policyId) {
        throw new Error('회비 정책을 먼저 저장해주세요.');
      }

      // Edge case: userId 누락 시 잘못된 upsert가 발생할 수 있어 명시적으로 검증
      if (!userId) {
        throw new Error('회원 식별자가 올바르지 않습니다.');
      }

      const { data: existing, error: existingError } = await supabase
        .from('membership_fee_records')
        .select('amount')
        .eq('id', policyId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (!existing) {
        throw new Error('유효한 회비 정책을 찾을 수 없습니다.');
      }

      const { error } = await supabase
        .from('membership_fee_records')
        .upsert({
          policy_id: policyId,
          user_id: userId,
          is_paid: isPaid,
          paid_at: isPaid ? new Date().toISOString() : null,
          amount_paid: isPaid ? existing.amount : null,
          note: null,
        }, {
          onConflict: 'policy_id,user_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.fees.all });
    },
  });

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCategory,
    deleteCategory,
    upsertMembershipPolicy,
    markMembershipPaid,
  };
}
