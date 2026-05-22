import { useState } from 'react';
import { useEventCategories } from '../hooks/useEventCategories';
import { useEventForm } from '../hooks/useEventForm';
import type { ClubEventWithDetails, EventCategory } from '../types';
import DatePicker from './Calendar/DatePicker';
import { EventCategoryEditor } from './events/EventCategoryEditor';
import { getTimeSlots } from '../utils/time';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editing: ClubEventWithDetails | null;
  initialDate?: Date;
}

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

interface ContentProps {
  onClose: () => void;
  editing: ClubEventWithDetails | null;
  initialDate?: Date;
  categories: EventCategory[];
}

function EventModalContent({ onClose, editing, initialDate, categories }: ContentProps) {
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<'start_date' | 'end_date' | null>(null);
  const times = getTimeSlots();

  const {
    title, setTitle,
    description, setDescription,
    location, setLocation,
    startDate, setStartDate,
    startTime, setStartTime,
    endDate, setEndDate,
    endTime, setEndTime,
    error, setError,
    effectiveCategoryId, setCategoryId,
    submitting, submit,
  } = useEventForm({ editing, initialDate, categories, onSuccess: onClose });

  return (
    <>
      <div
        className="modal-overlay active"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ padding: '70px 1rem 90px' }}
      >
        <div className="modal-container animate-slide-up" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          <div className="modal-header">
            <h2 className="font-headline text-2xl font-bold tracking-tight">
              {editing ? '일정' : '새 일정'} <span className="text-primary">{editing ? '수정' : '등록'}</span>
            </h2>
            <button
              type="button"
              aria-label="닫기"
              className="material-symbols-outlined text-2xl text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0 w-11 h-11 rounded-full border border-card-border bg-surface-container-low flex items-center justify-center"
              onClick={onClose}
            >
              close
            </button>
          </div>

          <div className="modal-body space-y-6">
            <EventCategoryEditor
              categories={categories}
              selectedCategoryId={effectiveCategoryId}
              isOpen={showCategoryEditor}
              onToggle={() => setShowCategoryEditor((v) => !v)}
              onSelect={setCategoryId}
              onAfterCreate={(id) => setCategoryId(id)}
              onAfterDelete={(id) => { if (effectiveCategoryId === id) setCategoryId(null); }}
              onError={setError}
            />

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
              onClick={submit}
              disabled={submitting}
              className="primary-btn flex-[2] py-4 shadow-xl"
            >
              {submitting ? '저장중...' : (editing ? '수정 사항 저장' : '일정 등록 완료')}
            </button>
          </div>
        </div>
      </div>

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
