import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { BudgetTransaction } from '../types';

export function useBudgetTransactions(fiscalYear?: number, fiscalHalf?: 1 | 2) {
  return useQuery({
    queryKey: queryKeys.budget.list(fiscalYear, fiscalHalf),
    queryFn: async () => {
      let q = supabase
        .from('budget_transactions')
        .select(`
          *,
          category:budget_categories(*),
          creator:profiles!budget_transactions_created_by_fkey(id, display_name)
        `)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fiscalYear) q = q.eq('fiscal_year', fiscalYear);
      if (fiscalHalf)  q = q.eq('fiscal_half', fiscalHalf);

      const { data, error } = await q;
      if (error) throw error;
      return data as BudgetTransaction[];
    },
  });
}
