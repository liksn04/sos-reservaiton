import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../lib/queryKeys'
import { useAuth } from '../../context/AuthContext'

/**
 * 일정 참가 신청을 위한 뮤테이션 훅
 */
export function useJoinEvent() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!profile?.id) throw new Error('로그인이 필요합니다.')

      const { data, error } = await supabase
        .from('event_participants')
        .insert({ 
          event_id: eventId, 
          user_id: profile.id 
        })
        .select()
        .single()

      if (error) {
        // 유니크 제약 조건 위반 (이미 참가한 경우)
        if (error.code === '23505') {
          throw new Error('이미 참가 신청이 완료된 일정입니다.')
        }
        throw error
      }
      
      return data
    },
    onSuccess: (_, eventId) => {
      // 해당 일정의 참가자 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.events.participants.byEvent(eventId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.summaries.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
    },
  })
}

/**
 * 일정 참가 취소를 위한 뮤테이션 훅
 */
export function useLeaveEvent() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!profile?.id) throw new Error('로그인이 필요합니다.')

      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', profile.id)

      if (error) throw error
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.participants.byEvent(eventId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.summaries.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
    },
  })
}

/**
 * 어드민이 참가자의 출석 상태를 변경하기 위한 뮤테이션 훅
 */
export function useMarkAttended() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({ 
      participantId, 
      attended 
    }: { 
      participantId: string; 
      attended: boolean;
    }) => {
      if (!profile?.is_admin) throw new Error('관리자 권한이 필요합니다.')

      const { error } = await supabase
        .from('event_participants')
        .update({ attended })
        .eq('id', participantId)

      if (error) throw error
    },
    onSuccess: () => {
      // 모든 참가자 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.events.participants.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.summaries.all })
    },

  })
}
