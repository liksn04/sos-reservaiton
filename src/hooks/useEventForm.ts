import { useState } from 'react';
import { useCreateEvent, useUpdateEvent } from './mutations/useEventMutations';
import { useToast } from '../contexts/useToast';
import type { ClubEventInput, ClubEventWithDetails, EventCategory } from '../types';

interface UseEventFormArgs {
  editing: ClubEventWithDetails | null;
  initialDate?: Date;
  categories: EventCategory[];
  onSuccess: () => void;
}

function formatToday(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function useEventForm({ editing, initialDate, categories, onSuccess }: UseEventFormArgs) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { addToast } = useToast();

  const [initialStartDate] = useState(() => formatToday(initialDate ?? new Date()));
  const [categoryId, setCategoryId] = useState<string | null>(editing?.category_id ?? null);
  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [location, setLocation] = useState(editing?.location ?? '');
  const [startDate, setStartDate] = useState(editing?.start_date ?? initialStartDate);
  const [startTime, setStartTime] = useState(editing?.start_time?.slice(0, 5) ?? '');
  const [endDate, setEndDate] = useState(editing?.end_date ?? '');
  const [endTime, setEndTime] = useState(editing?.end_time?.slice(0, 5) ?? '');
  const [error, setError] = useState<string | null>(null);

  const effectiveCategoryId = categoryId ?? (!editing ? categories[0]?.id ?? null : null);
  const submitting = createEvent.isPending || updateEvent.isPending;

  async function submit() {
    setError(null);
    if (!title.trim()) {
      setError('일정 제목을 입력해주세요.');
      return;
    }
    if (!startDate) {
      setError('시작 날짜를 선택해주세요.');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('종료일은 시작일 이후여야 합니다.');
      return;
    }

    const payload: ClubEventInput = {
      category_id: effectiveCategoryId,
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      start_date: startDate,
      start_time: startTime || null,
      end_date: endDate || null,
      end_time: endTime || null,
    };

    try {
      if (editing) {
        await updateEvent.mutateAsync({ id: editing.id, patch: payload });
        addToast('일정이 성공적으로 수정되었습니다.', 'success');
      } else {
        await createEvent.mutateAsync(payload);
        addToast('새 일정이 등록되었습니다.', 'success');
      }
      onSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다.';
      setError(msg);
      addToast(msg, 'error');
    }
  }

  return {
    title, setTitle,
    description, setDescription,
    location, setLocation,
    startDate, setStartDate,
    startTime, setStartTime,
    endDate, setEndDate,
    endTime, setEndTime,
    error,
    setError,
    effectiveCategoryId,
    setCategoryId,
    submitting,
    submit,
  };
}
