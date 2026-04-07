import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { useAuth } from '../../context/AuthContext';
import type { ClubEventInput, EventCategory } from '../../types';

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: ClubEventInput) => {
      if (!profile?.is_admin) throw new Error('관리자만 일정을 등록할 수 있습니다.');

      const payload = {
        ...input,
        created_by: profile.id,
        is_public: input.is_public ?? true,
      };

      const { data, error } = await supabase
        .from('club_events')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ClubEventInput> }) => {
      if (!profile?.is_admin) throw new Error('관리자만 일정을 수정할 수 있습니다.');

      const { data, error } = await supabase
        .from('club_events')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!profile?.is_admin) throw new Error('관리자만 일정을 삭제할 수 있습니다.');
      const { error } = await supabase.from('club_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

// ── Categories (admin only) ──────────────────────────────
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<EventCategory, 'id' | 'created_at'>) => {
      if (!profile?.is_admin) throw new Error('관리자만 카테고리를 추가할 수 있습니다.');
      const { data, error } = await supabase
        .from('event_categories')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as EventCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!profile?.is_admin) throw new Error('관리자만 카테고리를 삭제할 수 있습니다.');
      const { error } = await supabase.from('event_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}
