import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useBudgetCategories } from '../hooks/useBudgetCategories';
import { useBudgetMutations, uploadReceipt } from '../hooks/mutations/useBudgetMutations';
import { useToast } from '../contexts/useToast';
import type { BudgetTransaction, BudgetTransactionInput, BudgetCategory } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** null: 신규 등록, 값 있음: 수정 */
  editing: BudgetTransaction | null;
  /** 현재 페이지의 회계연도·학기 컨텍스트 (기본값으로 사용) */
  fiscalYear: number;
  fiscalHalf: 1 | 2;
}

const ICON_OPTIONS = [
  'payments', 'account_balance', 'savings', 'receipt', 'sell',
  'restaurant', 'sports_esports', 'mic', 'music_note', 'celebration',
];
const COLOR_PRESETS = [
  '#10b981', '#3b82f6', '#a855f7', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#6b7280',
];

export default function BudgetTransactionModal({ isOpen, onClose, editing, fiscalYear, fiscalHalf }: Props) {
  const { data: categories = [] } = useBudgetCategories();
  const { createTransaction, updateTransaction, createCategory, deleteCategory } = useBudgetMutations();
  const { addToast } = useToast();

  // ── 폼 상태 ────────────────────────────────────────────────────────────
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [txDate, setTxDate] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [error, setError] = useState<string | null>(null);

  // ── 영수증 업로드 상태 ──────────────────────────────────────────────────
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── 카테고리 편집 상태 ──────────────────────────────────────────────────
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_PRESETS[0]);
  const [newCatIcon, setNewCatIcon] = useState(ICON_OPTIONS[0]);

  // ── 현재 타입에 맞는 카테고리만 필터 ─────────────────────────────────────
  const filteredCategories = categories.filter((c) => c.type === txType);

  // ── 모달 열릴 때 초기화 ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setTxType(editing.type);
      setCategoryId(editing.category_id);
      setAmount(String(editing.amount));
      setDescription(editing.description);
      setTxDate(editing.transaction_date);
      setBankAccount(editing.bank_account ?? '');
      setExistingReceiptUrl(editing.receipt_url);
    } else {
      setTxType('expense');
      setCategoryId(null);
      setAmount('');
      setDescription('');
      // 오늘 날짜를 기본값으로
      const today = new Date();
      setTxDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
      setBankAccount('');
      setExistingReceiptUrl(null);
    }
    setReceiptFile(null);
    setReceiptPreview(null);
    setError(null);
    setShowCategoryEditor(false);
  }, [isOpen, editing]);

  // ── 타입 바뀌면 카테고리 초기화 ────────────────────────────────────────
  useEffect(() => {
    setCategoryId(null);
  }, [txType]);

  // ── ESC 닫기 ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ── 영수증 파일 선택 ──────────────────────────────────────────────────────
  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Edge case: 이미지가 아닌 파일 방어
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    // Edge case: 5MB 초과 파일 방어
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }
    setError(null);
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  // ── 카테고리 추가 ─────────────────────────────────────────────────────────
  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    try {
      const c = await createCategory.mutateAsync({
        name: newCatName.trim(),
        type: txType,
        color: newCatColor,
        icon: newCatIcon,
      });
      setNewCatName('');
      setCategoryId(c.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : '카테고리 추가에 실패했습니다.');
    }
  }

  // ── 카테고리 삭제 ─────────────────────────────────────────────────────────
  async function handleDeleteCategory(cat: BudgetCategory) {
    if (!confirm(`'${cat.name}' 카테고리를 삭제하시겠습니까?\n연결된 거래 내역의 카테고리가 비워집니다.`)) return;
    try {
      await deleteCategory.mutateAsync(cat.id);
      if (categoryId === cat.id) setCategoryId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '카테고리 삭제에 실패했습니다. 해당 카테고리를 사용하는 내역이 있는지 확인해주세요.');
    }
  }

  // ── 폼 제출 ──────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setError(null);
    // Edge case: 필수 필드 검증
    const parsedAmount = Number(amount.replace(/,/g, ''));
    if (!description.trim()) return setError('항목명을 입력해주세요.');
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) return setError('올바른 금액을 입력해주세요.');
    if (!txDate) return setError('날짜를 선택해주세요.');

    setIsUploading(true);
    try {
      // 영수증 업로드 처리
      let receiptUrl = existingReceiptUrl;
      if (receiptFile) {
        const { data: userData } = await supabase.auth.getUser();
        // Edge case: 인증되지 않은 사용자
        if (!userData.user) throw new Error('로그인이 필요합니다.');
        receiptUrl = await uploadReceipt(receiptFile, userData.user.id);
      }

      const payload: BudgetTransactionInput = {
        category_id: categoryId,
        type: txType,
        amount: parsedAmount,
        description: description.trim(),
        transaction_date: txDate,
        bank_account: bankAccount.trim() || null,
        receipt_url: receiptUrl,
        fiscal_year: fiscalYear,
        fiscal_half: fiscalHalf,
      };

      if (editing) {
        await updateTransaction.mutateAsync({ id: editing.id, input: payload });
        addToast('거래 내역이 수정되었습니다.', 'success');
      } else {
        await createTransaction.mutateAsync(payload);
        addToast('새 거래 내역이 등록되었습니다.', 'success');
      }
      onClose();
    } catch (e) {
      // Edge case: 네트워크 오류, 권한 오류 등
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다. 다시 시도해주세요.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  }

  const isSubmitting = isUploading || createTransaction.isPending || updateTransaction.isPending;

  // ── 금액 포맷팅 (입력 중 콤마 추가) ─────────────────────────────────────
  function handleAmountChange(v: string) {
    const digits = v.replace(/[^0-9]/g, '');
    setAmount(digits ? Number(digits).toLocaleString() : '');
  }

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ padding: '70px 1rem 90px' }}
    >
      <div className="modal-container animate-slide-up" style={{ maxHeight: 'calc(100vh - 160px)' }}>

        {/* ── 헤더 ── */}
        <div className="modal-header" style={{ paddingTop: '2.5rem' }}>
          <h2 className="font-headline text-2xl font-bold tracking-tight">
            {editing ? '거래 내역' : '새 거래'}{' '}
            <span className={txType === 'income' ? 'text-emerald-500' : 'text-rose-500'}>
              {editing ? '수정' : '등록'}
            </span>
          </h2>
          <button
            className="material-symbols-outlined text-[28px] text-muted hover:text-on-surface transition-colors"
            onClick={onClose}
          >
            close
          </button>
        </div>

        <div className="modal-body space-y-6">

          {/* ── 수입/지출 타입 토글 ── */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-card-border bg-surface-container-low">
            {(['income', 'expense'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxType(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  txType === t
                    ? t === 'income'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'opacity-40 hover:opacity-80'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {t === 'income' ? 'add_circle' : 'remove_circle'}
                </span>
                {t === 'income' ? '수입' : '지출'}
              </button>
            ))}
          </div>

          {/* ── 금액 ── */}
          <div className="form-group">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">
              금액 (원)
            </label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted">원</span>
              <input
                type="text"
                inputMode="numeric"
                className="w-full h-[54px] bg-surface-container-high border border-outline-variant/10 rounded-2xl px-4 pr-10 font-black text-xl outline-none focus:border-primary/50 transition-colors text-right"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* ── 항목명 ── */}
          <div className="form-group">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">
              항목명
            </label>
            <input
              type="text"
              className="w-full h-[54px] bg-surface-container-high border border-outline-variant/10 rounded-2xl px-4 font-bold outline-none focus:border-primary/50 transition-colors"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 공연 소품 구매"
              maxLength={100}
            />
          </div>

          {/* ── 날짜 ── */}
          <div className="form-group">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">
              날짜
            </label>
            <div className="relative">
              <span className="material-symbols-outlined text-xl absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                calendar_today
              </span>
              <input
                type="date"
                className="w-full h-[54px] bg-surface-container-high border border-outline-variant/10 rounded-2xl font-bold outline-none focus:border-primary/50 transition-colors"
                style={{ paddingLeft: '3.2rem', paddingRight: '1rem' }}
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
            </div>
          </div>

          {/* ── 카테고리 ── */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                카테고리
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryEditor((v) => !v)}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                {showCategoryEditor ? '닫기' : '편집'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {filteredCategories.length === 0 ? (
                <p className="text-xs text-muted italic">이 유형의 카테고리가 없습니다. 편집에서 추가해주세요.</p>
              ) : (
                filteredCategories.map((c) => {
                  const active = c.id === categoryId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(active ? null : c.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all"
                      style={{
                        backgroundColor: active ? `${c.color}25` : 'var(--surface-container-highest)',
                        color: active ? c.color : 'var(--text-muted)',
                        border: `1px solid ${active ? c.color : 'var(--outline-border)'}`,
                      }}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {c.icon}
                      </span>
                      {c.name}
                      {showCategoryEditor && (
                        <span
                          className="material-symbols-outlined text-sm text-error ml-1 hover:scale-125 transition-transform"
                          onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c); }}
                        >
                          close
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {showCategoryEditor && (
              <div
                className="mt-3 p-4 rounded-2xl space-y-3"
                style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline-border)' }}
              >
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                  {fiscalYear}년 {fiscalHalf}학기
                </span>
                <input
                  className="w-full bg-transparent text-sm font-bold outline-none border-b border-outline-border pb-2"
                  placeholder="카테고리 이름"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ color: 'var(--text-main)', borderColor: 'var(--outline-border)' }}
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
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
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
                  style={{ opacity: !newCatName.trim() ? 0.5 : 1 }}
                >
                  {createCategory.isPending ? '추가 중...' : '카테고리 추가'}
                </button>
              </div>
            )}
          </div>

          {/* ── 영수증 이미지 ── */}
          <div className="form-group">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">
              영수증 이미지 (선택)
            </label>
            <input
              ref={receiptInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReceiptChange}
            />
            {(receiptPreview || existingReceiptUrl) ? (
              <div className="relative group w-full aspect-video rounded-2xl overflow-hidden border border-card-border">
                <img
                  src={receiptPreview ?? existingReceiptUrl!}
                  alt="영수증 미리보기"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => receiptInputRef.current?.click()}
                    className="px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-white text-xs font-bold"
                  >
                    변경
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReceiptFile(null); setReceiptPreview(null); setExistingReceiptUrl(null); }}
                    className="px-4 py-2 bg-error/30 backdrop-blur rounded-xl text-white text-xs font-bold"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => receiptInputRef.current?.click()}
                className="w-full h-24 rounded-2xl border-2 border-dashed border-card-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 group"
              >
                <span className="material-symbols-outlined text-[28px] text-muted group-hover:text-primary transition-colors">
                  add_photo_alternate
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-primary transition-colors">
                  영수증 첨부
                </span>
              </button>
            )}
          </div>

          {/* ── 계좌 정보 (선택) ── */}
          <div className="form-group">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">
              계좌/결제 수단 (선택)
            </label>
            <input
              type="text"
              className="w-full h-[54px] bg-surface-container-high border border-outline-variant/10 rounded-2xl px-4 font-bold outline-none focus:border-primary/50 transition-colors"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="예: 카카오뱅크 001-XXXX"
              maxLength={80}
            />
          </div>

          {/* ── 에러 메시지 ── */}
          {error && (
            <div
              className="text-xs font-bold p-4 rounded-2xl flex items-center gap-2 bg-error/10 text-error border border-error/20"
            >
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}
        </div>

        {/* ── 푸터 ── */}
        <div className="modal-footer">
          <button onClick={onClose} className="secondary-btn flex-1 py-4" disabled={isSubmitting}>
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="primary-btn flex-[2] py-4 shadow-xl"
          >
            {isSubmitting ? '저장 중...' : editing ? '수정 완료' : '거래 등록'}
          </button>
        </div>

      </div>
    </div>
  );
}
