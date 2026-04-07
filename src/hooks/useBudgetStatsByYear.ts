import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'

export function useBudgetStatsByYear(year: number) {
  return useQuery({
    queryKey: queryKeys.budget.stats(year),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('type, amount')
        .eq('fiscal_year', year)

      if (error) throw error

      const income = data
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const expense = data
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      return {
        income,
        expense,
        balance: income - expense,
        count: data.length,
      }
    },
  })
}

export function useBudgetAvailableYears() {
  return useQuery({
    queryKey: queryKeys.budget.availableYears,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('fiscal_year')
        .order('fiscal_year', { ascending: false })

      if (error) throw error

      // 고유 연도 추출
      const years = Array.from(new Set(data.map((d) => d.fiscal_year)))
      return years.length > 0 ? years : [new Date().getFullYear()]
    },
  })
}
