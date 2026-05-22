import { useState } from 'react';
import type { EventCategory } from '../../types';
import { useCreateCategory, useDeleteCategory } from '../../hooks/mutations/useEventMutations';
import { useConfirm } from '../../contexts/useConfirm';
import { EVENT_CATEGORY_COLOR_PRESETS, EVENT_CATEGORY_ICON_OPTIONS } from './eventCategoryConstants';

interface Props {
  categories: EventCategory[];
  selectedCategoryId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onAfterDelete: (id: string) => void;
  onAfterCreate: (id: string) => void;
  onError: (message: string) => void;
}

export function EventCategoryEditor({
  categories,
  selectedCategoryId,
  isOpen,
  onToggle,
  onSelect,
  onAfterDelete,
  onAfterCreate,
  onError,
}: Props) {
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const confirm = useConfirm();
  const [name, setName] = useState('');
  const [color, setColor] = useState(EVENT_CATEGORY_COLOR_PRESETS[0]);
  const [icon, setIcon] = useState(EVENT_CATEGORY_ICON_OPTIONS[0]);

  async function handleAdd() {
    if (!name.trim()) return;
    try {
      const created = await createCategory.mutateAsync({
        name: name.trim(),
        color,
        icon,
        sort_order: 50,
      });
      setName('');
      onAfterCreate(created.id);
    } catch (e) {
      onError(e instanceof Error ? e.message : '카테고리 추가에 실패했습니다.');
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: '카테고리 삭제',
      description: '이 카테고리를 삭제하시겠습니까? 연결된 일정의 카테고리는 비워집니다.',
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteCategory.mutateAsync(id);
      onAfterDelete(id);
    } catch (e) {
      onError(e instanceof Error ? e.message : '카테고리 삭제에 실패했습니다.');
    }
  }

  return (
    <div className="form-group">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted">카테고리</label>
        <button
          type="button"
          onClick={onToggle}
          className="text-[11px] font-bold text-primary hover:underline"
        >
          {isOpen ? '닫기' : '편집'}
        </button>
      </div>
      <div className="chip-group-wrap">
        {categories.map((c) => {
          const active = c.id === selectedCategoryId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all"
              style={{
                backgroundColor: active ? `${c.color}25` : 'var(--surface-container-highest)',
                color: active ? c.color : 'var(--text-muted)',
                border: `1px solid ${active ? c.color : 'var(--outline-border)'}`,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
              {c.name}
              {isOpen && (
                <span
                  className="material-symbols-outlined text-sm text-error ml-1 hover:scale-125 transition-transform"
                  onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                >
                  close
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isOpen && (
        <div
          className="mt-3 p-4 rounded-2xl space-y-3 animate-fade-in"
          style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline-border)' }}
        >
          <input
            className="w-full bg-transparent text-sm font-bold outline-none border-b border-white/10 pb-2"
            placeholder="새 카테고리 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-1.5 flex-wrap">
            {EVENT_CATEGORY_COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-all hover:scale-110"
                style={{
                  backgroundColor: c,
                  boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                  border: `2px solid ${color === c ? 'white' : 'transparent'}`,
                }}
              />
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {EVENT_CATEGORY_ICON_OPTIONS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                style={{
                  backgroundColor: icon === i ? color : 'var(--surface-container-high)',
                  color: icon === i ? '#fff' : 'var(--text-muted)',
                }}
              >
                <span className="material-symbols-outlined text-xl">{i}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={createCategory.isPending || !name.trim()}
            className="w-full py-2.5 rounded-xl text-xs font-black tracking-wider uppercase bg-primary-btn text-white"
          >
            카테고리 추가
          </button>
        </div>
      )}
    </div>
  );
}
