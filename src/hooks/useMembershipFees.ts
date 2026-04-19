import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type {
  MembershipFeePolicy,
  MembershipFeeRecord,
} from '../types';
import { buildMembershipFeeMemberStatuses } from '../utils/membershipFees';

export function useMembershipFees(year: number, half: number) {
  const query = useQuery({
    queryKey: [...queryKeys.budget.fees.all, year, half],
    queryFn: async () => {
      const { data: policy, error: policyError } = await supabase
        .from('membership_fee_policies')
        .select('*')
        .eq('fiscal_year', year)
        .eq('fiscal_half', half)
        .maybeSingle();

      if (policyError) throw policyError;

      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('status', 'approved')
        .order('display_name');

      if (pError) throw pError;

      // Edge case: 정책이 아직 없으면 레코드 조회를 생략하고 기본 상태 목록만 구성
      if (!policy) {
        return {
          policy: null,
          records: buildMembershipFeeMemberStatuses({
            policyId: null,
            profiles: profiles ?? [],
            records: [],
          }),
        };
      }

      const { data: fees, error: fError } = await supabase
        .from('membership_fee_records')
        .select('id, policy_id, user_id, paid_at, amount_paid, is_paid, note')
        .eq('policy_id', policy.id);

      if (fError) throw fError;

      return {
        policy: policy as MembershipFeePolicy,
        records: buildMembershipFeeMemberStatuses({
          policyId: policy.id,
          profiles: profiles ?? [],
          records: (fees ?? []) as MembershipFeeRecord[],
        }),
      };
    },
  });

  return {
    policy: query.data?.policy ?? null,
    records: query.data?.records ?? [],
    isLoading: query.isLoading,
  };
}
