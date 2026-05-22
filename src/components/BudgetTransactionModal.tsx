import { useEffect, useRef, useState } from 'react';
import { useBudgetCategories } from '../hooks/useBudgetCategories';
import { useBudgetMutations } from '../hooks/mutations/useBudgetMutations';
import { useToast } from '../contexts/useToast';
import { useConfirm } from '../contexts/useConfirm';
import { createImagePreviewUrl, revokePreviewUrl } from '../utils/fileUpload';
import { CategorySection } from './BudgetTransactionModal/CategorySection';
import { BUDGET_CATEGORY_COLOR_PRESETS, BUDGET_CATEGORY_ICON_OPTIONS } from './BudgetTransactionModal/constants';
import { ReceiptUploadField } from './BudgetTransactionModal/ReceiptUploadField';
import { TransactionTypeToggle } from './BudgetTransactionModal/TransactionTypeToggle';
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

export default function BudgetTransactionModal({ isOpen, onClose, editing, fiscalYear, fiscalHalf }: Props) {
  const { data: categories = [] } = useBudgetCategories();
  const { createTransaction, updateTransaction, createCategory, deleteCategory } = useBudgetMutations();
  const { addToast } = useToast();
  const confirm = useConfirm();

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
  const [newCatColor, setNewCatColor] = useState(BUDGET_CATEGORY_COLOR_PRESETS[0]);
  const [newCatIcon, setNewCatIcon] = useState(BUDGET_CATEGORY_ICON_OPTIONS[0]);

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

  useEffect(() => {
    return () => {
      revokePreviewUrl(receiptPreview);
    };
  }, [receiptPreview]);

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

    try {
      setReceiptPreview(createImagePreviewUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 업로드 파일이 올바르지 않습니다.');
      e.target.value = '';
      return;
    }

    setError(null);
    setReceiptFile(file);
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
    const ok = await confirm({
      title: '카테고리 삭제',
      description: `'${cat.name}' 카테고리를 삭제하시겠습니까?\n연결된 거래 내역의 카테고리가 비워집니다.`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
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
      const payload: BudgetTransactionInput = {
        category_id: categoryId,
        type: txType,
        amount: parsedAmount,
        description: description.trim(),
        transaction_date: txDate,
        bank_account: bankAccount.trim() || null,
        receipt_url: existingReceiptUrl,
        fiscal_year: fiscalYear,
        fiscal_half: fiscalHalf,
      };

      if (editing) {
        await updateTransaction.mutateAsync({ id: editing.id, input: payload, receiptFile });
        addToast('거래 내역이 수정되었습니다.', 'success');
      } else {
        await createTransaction.mutateAsync({ input: payload, receiptFile });
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

          <TransactionTypeToggle value={txType} onChange={setTxType} />

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

          <CategorySection
            categories={filteredCategories}
            selectedCategoryId={categoryId}
            transactionType={txType}
            fiscalYear={fiscalYear}
            fiscalHalf={fiscalHalf}
            isEditorOpen={showCategoryEditor}
            newCategoryName={newCatName}
            newCategoryColor={newCatColor}
            newCategoryIcon={newCatIcon}
            isCreatingCategory={createCategory.isPending}
            onToggleEditor={() => setShowCategoryEditor((value) => !value)}
            onSelectCategory={setCategoryId}
            onDeleteCategory={handleDeleteCategory}
            onNewCategoryNameChange={setNewCatName}
            onNewCategoryColorChange={setNewCatColor}
            onNewCategoryIconChange={setNewCatIcon}
            onAddCategory={handleAddCategory}
          />

          <ReceiptUploadField
            inputRef={receiptInputRef}
            previewUrl={receiptPreview}
            existingUrl={existingReceiptUrl}
            onFileChange={handleReceiptChange}
            onClear={() => {
              setReceiptFile(null);
              setReceiptPreview(null);
              setExistingReceiptUrl(null);
            }}
          />

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
