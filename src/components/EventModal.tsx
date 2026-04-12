import { useState } from 'react';
import { useEventCategories } from '../hooks/useEventCategories';
import { useToast } from '../contexts/useToast';
import {
  useCreateEvent,
  useUpdateEvent,
  useCreateCategory,
  useDeleteCategory,
} from '../hooks/mutations/useEventMutations';
import type { ClubEventWithDetails, ClubEventInput, EventCategory } from '../types';
import DatePicker from './Calendar/DatePicker';
import { getTimeSlots } from '../utils/time';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editing: ClubEventWithDetails | null;
  initialDate?: Date;
}

const ICON_OPTIONS = [
  'event', 'theater_comedy', 'music_note', 'celebration',
  'forest', 'school', 'campaign', 'star', 'flag', 'cake',
];

const COLOR_PRESETS = [
  '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#a855f7', '#ef4444', '#06b6d4', '#6b7280',
];

export default function EventModal({ isOpen, onClose, editing, initialDate }: Props) {
  const { data: categories = [] } = useEventCategories();

  if (!isOpen) return null;

  const formKey = editing?.id ?? `new-${initialDate?.toISOString() ?? 'default'}`;

  return (
    <EventModalContent
      key={formKey}
      onClose={onClose}
      editing={editing}
      initialDate={initialDate}
      categories={categories}
    />
  );
}

function EventModalContent({
  onClose,
  editing,
  initialDate,
  categories,
}: Omit<Props, 'isOpen'> & { categories: EventCategory[] }) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const { addToast } = useToast();

  const [showCategoryEditor, setShowCategoryEditor] = useState(false);

  // picker state
  const [pickerOpen, setPickerOpen] = useState<'start_date' | 'end_date' | null>(null);

  const times = getTimeSlots();

  // category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_PRESETS[0]);
  const [newCatIcon, setNewCatIcon] = useState('event');
  const [initialStartDate] = useState(() => {
    const date = initialDate ?? new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
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

  async function handleSubmit() {
    setError(null);
    if (!title.trim()) return setError('일정 제목을 입력해주세요.');
    if (!startDate) return setError('시작 날짜를 선택해주세요.');
    if (endDate && endDate < startDate) return setError('종료일은 시작일 이후여야 합니다.');

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
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다.';
      setError(msg);
      addToast(msg, 'error');
    }
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    try {
      const c = await createCategory.mutateAsync({
        name: newCatName.trim(),
        color: newCatColor,
        icon: newCatIcon,
        sort_order: 50,
      });
      setNewCatName('');
      setCategoryId(c.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : '카테고리 추가에 실패했습니다.');
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('이 카테고리를 삭제하시겠습니까? 연결된 일정의 카테고리는 비워집니다.')) return;
    try {
      await deleteCategory.mutateAsync(id);
      if (effectiveCategoryId === id) setCategoryId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '카테고리 삭제에 실패했습니다.');
    }
  }

  const submitting = createEvent.isPending || updateEvent.isPending;

  return (
    <>
      <div
        className="modal-overlay active"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ padding: '70px 1rem 90px' }}
      >
        <div className="modal-container animate-slide-up" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          <div className="modal-header" style={{ paddingTop: '2.5rem' }}>
            <h2 className="font-headline text-2xl font-bold tracking-tight">
              {editing ? '일정' : '새 일정'} <span className="text-primary">{editing ? '수정' : '등록'}</span>
            </h2>
            <button
              className="material-symbols-outlined text-[28px] text-muted hover:text-white transition-colors"
              onClick={onClose}>
              close
            </button>
          </div>

          <div className="modal-body space-y-6">
            {/* 카테고리 */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">카테고리</label>
                <button
                  type="button"
                  onClick={() => setShowCategoryEditor((v) => !v)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  {showCategoryEditor ? '닫기' : '편집'}
                </button>
              </div>
              <div className="chip-group-wrap">
                {categories.map((c) => {
                  const active = c.id === effectiveCategoryId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all"
                      style={{
                        backgroundColor: active ? `${c.color}25` : 'var(--surface-container-highest)',
                        color: active ? c.color : 'var(--text-muted)',
                        border: `1px solid ${active ? c.color : 'var(--outline-border)'}`,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                      {c.name}
                      {showCategoryEditor && (
                        <span
                          className="material-symbols-outlined text-sm text-error ml-1 hover:scale-125 transition-transform"
                          onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }}
                        >
                          close
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {showCategoryEditor && (
                <div
                  className="mt-3 p-4 rounded-2xl space-y-3 animate-fade-in"
                  style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline-border)' }}
                >
                  <input
                    className="w-full bg-transparent text-sm font-bold outline-none border-b border-white/10 pb-2"
                    placeholder="새 카테고리 이름"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCatColor(c)}
                        className="w-7 h-7 rounded-full transition-all hover:scale-110"
                        style={{
                          backgroundColor: c,
                          boxShadow: newCatColor === c ? `0 0 12px ${c}` : 'none',
                          border: `2px solid ${newCatColor === c ? 'white' : 'transparent'}`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {ICON_OPTIONS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewCatIcon(i)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                        style={{
                          backgroundColor: newCatIcon === i ? newCatColor : 'var(--surface-container-high)',
                          color: newCatIcon === i ? '#fff' : 'var(--text-muted)',
                        }}
                      >
                        <span className="material-symbols-outlined text-xl">{i}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={createCategory.isPending || !newCatName.trim()}
                    className="w-full py-2.5 rounded-xl text-xs font-black tracking-wider uppercase bg-primary-btn text-white"
                  >
                    카테고리 추가
                  </button>
                </div>
              )}
            </div>

            {/* 제목 */}
            <div className="form-group">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">제목</label>
              <input
                type="text"
                className="w-full h-[54px] bg-black/20 border border-white/5 rounded-2xl px-4 font-bold text-lg outline-none focus:border-primary/50 transition-colors"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 2026 정기공연"
                maxLength={80}
              />
            </div>

            {/* 시작/종료 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group pb-4 border-b border-white/5 md:border-b-0 md:border-r md:pr-6">
                <label className="text-[10px] font-black uppercase tracking-widest mb-3 block text-muted">시작 일시</label>
                <div className="flex flex-col gap-4">
                  <div className="premium-input-box group" onClick={() => setPickerOpen('start_date')}>
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">calendar_today</span>
                    <span className="premium-input-value font-bold">{startDate || '날짜 선택'}</span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined text-xl absolute left-4 top-1/2 -translate-y-1/2 text-primary z-10">schedule</span>
                    <select
                      className="premium-select-input"
                      style={{ paddingLeft: '3.5rem' }}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    >
                      <option value="">시간 미정</option>
                      {times.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest mb-3 block text-muted">종료 일시 (선택)</label>
                <div className="flex flex-col gap-4">
                  <div className="premium-input-box group" onClick={() => setPickerOpen('end_date')}>
                    <span className="material-symbols-outlined text-muted">calendar_today</span>
                    <span className={`premium-input-value ${!endDate ? 'premium-input-placeholder' : ''}`}>
                      {endDate || '날짜 선택'}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined text-xl text-muted absolute left-4 top-1/2 -translate-y-1/2 z-10">schedule</span>
                    <select
                      className="premium-select-input"
                      style={{ paddingLeft: '3.5rem' }}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    >
                      <option value="">시간 미정</option>
                      {times.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 장소 */}
            <div className="form-group">
              <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5 text-muted">장소</label>
              <div className="relative">
                <span className="material-symbols-outlined text-xl text-muted absolute left-4 top-1/2 -translate-y-1/2">place</span>
                <input
                  type="text"
                  className="w-full h-[54px] bg-surface-container-high border border-outline-variant/10 rounded-2xl pr-4 font-bold outline-none focus:border-primary/50 transition-colors"
                  style={{ paddingLeft: '3.5rem' }}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예: 학생회관 대강당"
                />
              </div>
            </div>

            {/* 설명 */}
            <div className="form-group">
              <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5 text-muted">설명</label>
              <textarea
                rows={3}
                className="w-full bg-surface-container-high border border-outline-variant/10 rounded-2xl p-4 font-medium outline-none focus:border-primary/50 transition-colors resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="일정에 대한 추가 설명..."
              />
            </div>

            {error && (
              <div className="text-xs font-bold p-4 rounded-2xl animate-fade-in bg-error/10 text-error border border-error/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {error}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="secondary-btn flex-1 py-4">취소</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="primary-btn flex-[2] py-4 shadow-xl"
            >
              {submitting ? '저장중...' : (editing ? '수정 사항 저장' : '일정 등록 완료')}
            </button>
          </div>
        </div>
      </div>

      {/* 커스텀 피커 모달들 */}
      <DatePicker
        isOpen={pickerOpen === 'start_date'}
        selectedDate={startDate}
        onSelect={setStartDate}
        onClose={() => setPickerOpen(null)}
      />
      <DatePicker
        isOpen={pickerOpen === 'end_date'}
        selectedDate={endDate}
        onSelect={setEndDate}
        onClose={() => setPickerOpen(null)}
      />
    </>
  );
}
