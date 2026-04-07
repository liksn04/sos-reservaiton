import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import type { BudgetTransactionInput, BudgetCategory } from '../../types';

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

  const markMembershipPaid = useMutation({
    mutationFn: async ({
      user_id,
      year,
      half,
      is_paid,
    }: {
      user_id: string
      year: number
      half: number
      is_paid: boolean
    }) => {
      // 1. 기존 기록 확인
      const { data: existing } = await supabase
        .from('membership_fee_records')
        .select('id')
        .eq('user_id', user_id)
        .eq('fiscal_year', year)
        .eq('fiscal_half', half)
        .maybeSingle()

      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from('membership_fee_records')
          .update({ is_paid, paid_at: is_paid ? new Date().toISOString() : null })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        // 신규 생성
        const { error } = await supabase.from('membership_fee_records').insert({
          user_id,
          fiscal_year: year,
          fiscal_half: half,
          is_paid,
          paid_at: is_paid ? new Date().toISOString() : null,
        })
        if (error) throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.budget.fees.records(variables.year, variables.half as 1 | 2),
      })
    },
  })

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCategory,
    deleteCategory,
    markMembershipPaid,
  };
}
