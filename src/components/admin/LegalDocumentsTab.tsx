import { useMemo, useState } from 'react';
import { useLegalDocuments } from '../../hooks/useLegalDocument';
import { useUpdateLegalDocument } from '../../hooks/mutations/useLegalDocumentMutations';
import { useToast } from '../../contexts/useToast';
import LegalMarkdown from '../LegalMarkdown';
import type { LegalDocument, LegalDocumentSlug } from '../../types';

interface DraftState {
  title: string;
  intro: string;
  body: string;
  effective_date: string;
}

const SLUG_OPTIONS: { slug: LegalDocumentSlug; label: string; defaultTitle: string }[] = [
  { slug: 'terms', label: '서비스이용약관', defaultTitle: '서비스이용약관' },
  { slug: 'privacy', label: '개인정보 처리방침', defaultTitle: '개인정보 처리방침' },
];

function toDraft(document: LegalDocument | undefined, fallbackTitle: string): DraftState {
  if (!document) {
    return {
      title: fallbackTitle,
      intro: '',
      body: '',
      effective_date: new Date().toISOString().slice(0, 10),
    };
  }
  return {
    title: document.title,
    intro: document.intro ?? '',
    body: document.body ?? '',
    effective_date: document.effective_date,
  };
}

function isDirty(draft: DraftState, document: LegalDocument | undefined): boolean {
  if (!document) {
    return draft.title.trim() !== '' || draft.intro.trim() !== '' || draft.body.trim() !== '';
  }
  return (
    draft.title !== document.title ||
    draft.intro !== (document.intro ?? '') ||
    draft.body !== (document.body ?? '') ||
    draft.effective_date !== document.effective_date
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return '문서를 저장하지 못했습니다.';
}

interface LegalDocumentEditorProps {
  slug: LegalDocumentSlug;
  label: string;
  defaultTitle: string;
  document: LegalDocument | undefined;
}

function LegalDocumentEditor({ slug, label, defaultTitle, document }: LegalDocumentEditorProps) {
  const { addToast } = useToast();
  const updateDocument = useUpdateLegalDocument();
  const [draft, setDraft] = useState<DraftState>(() => toDraft(document, defaultTitle));
  const [preview, setPreview] = useState(false);

  const dirty = isDirty(draft, document);
  const isSaving = updateDocument.isPending;

  function updateDraft<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setDraft(toDraft(document, defaultTitle));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.title.trim()) {
      addToast('제목은 비울 수 없습니다.', 'error');
      return;
    }
    if (!draft.body.trim()) {
      addToast('본문은 비울 수 없습니다.', 'error');
      return;
    }

    try {
      await updateDocument.mutateAsync({
        slug,
        title: draft.title,
        intro: draft.intro,
        body: draft.body,
        effective_date: draft.effective_date,
      });
      addToast(`${label}을(를) 저장했습니다.`, 'success');
    } catch (error) {
      console.error(error);
      addToast(getErrorMessage(error), 'error');
    }
  }

  return (
    <form className="surface-card p-6 flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-lg font-black text-on-surface">{label}</h4>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">
            마지막 수정: {document ? document.updated_at.slice(0, 16).replace('T', ' ') : '— (신규 작성)'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPreview((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[16px]">
            {preview ? 'edit' : 'preview'}
          </span>
          {preview ? '편집' : '미리보기'}
        </button>
      </div>

      <div className="form-group">
        <label>제목</label>
        <input
          type="text"
          value={draft.title}
          maxLength={120}
          onChange={(event) => updateDraft('title', event.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>시행일</label>
        <input
          type="date"
          value={draft.effective_date}
          onChange={(event) => updateDraft('effective_date', event.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>인트로 (요약 문단)</label>
        <textarea
          rows={3}
          value={draft.intro}
          maxLength={500}
          placeholder="문서 상단에 보일 한두 문장 요약"
          onChange={(event) => updateDraft('intro', event.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="flex items-center justify-between">
          <span>본문 (Markdown)</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
            GitHub Flavored Markdown
          </span>
        </label>
        {preview ? (
          <div className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-low p-5 min-h-[320px]">
            {draft.body.trim() ? (
              <LegalMarkdown source={draft.body} />
            ) : (
              <p className="text-xs text-on-surface-variant/70 italic">미리볼 본문이 없습니다.</p>
            )}
          </div>
        ) : (
          <textarea
            rows={22}
            value={draft.body}
            onChange={(event) => updateDraft('body', event.target.value)}
            placeholder={'## 제1조 (목적)\n본 약관은 ...'}
            className="font-mono text-xs leading-relaxed"
            spellCheck={false}
          />
        )}
      </div>

      <div className="form-actions flex !flex-row !items-center !justify-end gap-2 !mt-0">
        <button
          type="button"
          onClick={handleReset}
          disabled={!dirty || isSaving}
          className="secondary-btn !h-11 !px-5"
        >
          변경 취소
        </button>
        <button type="submit" disabled={!dirty || isSaving} className="primary-btn !h-11 !px-6">
          {isSaving ? '저장 중...' : '문서 저장'}
        </button>
      </div>
    </form>
  );
}

export default function LegalDocumentsTab() {
  const { data: documents = [], isLoading } = useLegalDocuments();
  const [activeSlug, setActiveSlug] = useState<LegalDocumentSlug>('terms');

  const currentOption = useMemo(
    () => SLUG_OPTIONS.find((option) => option.slug === activeSlug) ?? SLUG_OPTIONS[0],
    [activeSlug],
  );
  const currentDocument = useMemo(
    () => documents.find((doc) => doc.slug === activeSlug),
    [documents, activeSlug],
  );

  if (isLoading) {
    return (
      <div className="bg-surface-container-low border border-card-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-bold opacity-60">법적 문서를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="surface-card p-6">
        <div className="club-tag mb-2">법적 문서</div>
        <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
          약관 / 처리방침 관리
        </h3>
        <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
          마크다운으로 작성하며, 저장 즉시 <code className="px-1 rounded bg-surface-container-high text-[0.85em]">/legal/terms</code>,{' '}
          <code className="px-1 rounded bg-surface-container-high text-[0.85em]">/legal/privacy</code> 페이지에 반영됩니다.
          모든 회원과 비회원이 볼 수 있는 공개 문서이므로 신중하게 수정해주세요.
        </p>
      </section>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {SLUG_OPTIONS.map((option) => {
          const isActive = option.slug === activeSlug;
          return (
            <button
              key={option.slug}
              type="button"
              onClick={() => setActiveSlug(option.slug)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-colors ${
                isActive
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <LegalDocumentEditor
        key={`${activeSlug}:${currentDocument?.updated_at ?? 'empty'}`}
        slug={activeSlug}
        label={currentOption.label}
        defaultTitle={currentOption.defaultTitle}
        document={currentDocument}
      />
    </div>
  );
}
