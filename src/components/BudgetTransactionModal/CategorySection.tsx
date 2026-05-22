import type { BudgetCategory, BudgetTransaction } from '../../types';
import { BUDGET_CATEGORY_COLOR_PRESETS, BUDGET_CATEGORY_ICON_OPTIONS } from './constants';

type TransactionType = BudgetTransaction['type'];

interface CategorySectionProps {
  categories: BudgetCategory[];
  selectedCategoryId: string | null;
  transactionType: TransactionType;
  fiscalYear: number;
  fiscalHalf: 1 | 2;
  isEditorOpen: boolean;
  newCategoryName: string;
  newCategoryColor: string;
  newCategoryIcon: string;
  isCreatingCategory: boolean;
  onToggleEditor: () => void;
  onSelectCategory: (categoryId: string | null) => void;
  onDeleteCategory: (category: BudgetCategory) => void;
  onNewCategoryNameChange: (name: string) => void;
  onNewCategoryColorChange: (color: string) => void;
  onNewCategoryIconChange: (icon: string) => void;
  onAddCategory: () => void;
}

export function CategorySection({
  categories,
  selectedCategoryId,
  transactionType,
  fiscalYear,
  fiscalHalf,
  isEditorOpen,
  newCategoryName,
  newCategoryColor,
  newCategoryIcon,
  isCreatingCategory,
  onToggleEditor,
  onSelectCategory,
  onDeleteCategory,
  onNewCategoryNameChange,
  onNewCategoryColorChange,
  onNewCategoryIconChange,
  onAddCategory,
}: CategorySectionProps) {
  return (
    <div className="form-group">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted">
          카테고리
        </label>
        <button
          type="button"
          onClick={onToggleEditor}
          className="text-[11px] font-bold text-primary hover:underline"
        >
          {isEditorOpen ? '닫기' : '편집'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.length === 0 ? (
          <p className="text-xs text-muted italic">이 유형의 카테고리가 없습니다. 편집에서 추가해주세요.</p>
        ) : (
          categories.map((category) => {
            const active = category.id === selectedCategoryId;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(active ? null : category.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all"
                style={{
                  backgroundColor: active ? `${category.color}25` : 'var(--surface-container-highest)',
                  color: active ? category.color : 'var(--text-muted)',
                  border: `1px solid ${active ? category.color : 'var(--outline-border)'}`,
                }}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {category.icon}
                </span>
                {category.name}
                {isEditorOpen && (
                  <span
                    className="material-symbols-outlined text-sm text-error ml-1 hover:scale-125 transition-transform"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteCategory(category);
                    }}
                  >
                    close
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {isEditorOpen && (
        <div
          className="mt-3 p-4 rounded-2xl space-y-3"
          style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline-border)' }}
        >
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
            {fiscalYear}년 {fiscalHalf}학기 {transactionType === 'income' ? '수입' : '지출'}
          </span>
          <input
            className="w-full bg-transparent text-sm font-bold outline-none border-b border-outline-border pb-2"
            placeholder="카테고리 이름"
            value={newCategoryName}
            onChange={(event) => onNewCategoryNameChange(event.target.value)}
            style={{ color: 'var(--text-main)', borderColor: 'var(--outline-border)' }}
          />
          <div className="flex gap-1.5 flex-wrap">
            {BUDGET_CATEGORY_COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onNewCategoryColorChange(color)}
                className="w-7 h-7 rounded-full transition-all hover:scale-110"
                style={{
                  backgroundColor: color,
                  boxShadow: newCategoryColor === color ? `0 0 12px ${color}` : 'none',
                  border: `2px solid ${newCategoryColor === color ? 'white' : 'transparent'}`,
                }}
              />
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {BUDGET_CATEGORY_ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => onNewCategoryIconChange(icon)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  backgroundColor: newCategoryIcon === icon ? newCategoryColor : 'var(--surface-container-high)',
                  color: newCategoryIcon === icon ? '#fff' : 'var(--text-muted)',
                }}
              >
                <span className="material-symbols-outlined text-xl">{icon}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onAddCategory}
            disabled={isCreatingCategory || !newCategoryName.trim()}
            className="w-full py-2.5 rounded-xl text-xs font-black tracking-wider uppercase bg-primary-btn text-white"
            style={{ opacity: !newCategoryName.trim() ? 0.5 : 1 }}
          >
            {isCreatingCategory ? '추가 중...' : '카테고리 추가'}
          </button>
        </div>
      )}
    </div>
  );
}
