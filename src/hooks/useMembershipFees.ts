import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import type { MembershipFeePolicy } from '../types'

export function useMembershipFees(year: number, half: number) {
  const { data: policy, isLoading: isLoadingPolicy } = useQuery({
    queryKey: queryKeys.budget.fees.policy(year, half as 1 | 2),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_fee_policies')
        .select('*')
        .eq('fiscal_year', year)
        .eq('fiscal_half', half)
        .maybeSingle()

      if (error) throw error
      return data as MembershipFeePolicy | null
    },
  })

  const { data: records, isLoading: isLoadingRecords } = useQuery({
    queryKey: queryKeys.budget.fees.records(year, half as 1 | 2),
    queryFn: async () => {
      // 모든 활성 회원(또는 정회원)을 가져오고, 해당 기간의 납부 기록을 결합
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, session, role')
        .eq('is_approved', true)
        .order('full_name')

      if (pError) throw pError

      const { data: fees, error: fError } = await supabase
        .from('membership_fee_records')
        .select('*')
        .eq('fiscal_year', year)
        .eq('fiscal_half', half)

      if (fError) throw fError

      return profiles.map((p) => {
        const record = fees.find((f) => f.user_id === p.id)
        return {
          ...p,
          is_paid: record?.is_paid ?? false,
          paid_at: record?.paid_at,
          record_id: record?.id,
        }
      })
    },
  })

  return {
    policy,
    records,
    isLoading: isLoadingPolicy || isLoadingRecords,
  }
}
