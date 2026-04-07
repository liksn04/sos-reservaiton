import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { BudgetCategory } from '../types';

export function useBudgetCategories() {
  return useQuery<BudgetCategory[]>({
    queryKey: queryKeys.budget.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .order('type', { ascending: false }) // income first
        .order('name');

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour (categories change rarely)
  });
}
