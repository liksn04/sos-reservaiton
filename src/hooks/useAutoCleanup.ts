import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/time';

/**
 * 2주가 경과한 지난 합주 기록을 자동으로 삭제하는 훅입니다.
 * 보안 및 성능을 위해 관리자(Admin) 권한이 있는 사용자가 접속했을 때만 실행됩니다.
 */
export function useAutoCleanup() {
  const { profile } = useAuth();

  useEffect(() => {
    // 관리자가 아니면 실행하지 않음
    if (!profile?.is_admin) return;

    const cleanup = async () => {
      // 14일 전 날짜 계산 (YYYY-MM-DD 형식)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const dateStr = formatDate(fourteenDaysAgo);

      console.log('🧹 [AutoCleanup] 14일 경과 데이터 삭제 중... (기준일:', dateStr, ')');

      // 기준일보다 이전(lt)인 데이터 삭제
      const { error, count } = await supabase
        .from('reservations')
        .delete({ count: 'exact' }) // 얼마나 삭제됐는지 확인 (선택 사항)
        .lt('date', dateStr);

      if (error) {
        console.error('❌ [AutoCleanup] 삭제 실패:', error);
      } else {
        console.log(`✅ [AutoCleanup] 삭제 완료 (삭제된 개수: ${count ?? 0})`);
      }
    };

    cleanup();
  }, [profile?.is_admin]);
}
