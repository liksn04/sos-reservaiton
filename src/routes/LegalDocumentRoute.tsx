import { useNavigate } from 'react-router-dom';
import { useLegalDocument } from '../hooks/useLegalDocument';
import LegalMarkdown from '../components/LegalMarkdown';
import type { LegalDocumentSlug } from '../types';

interface LegalDocumentRouteProps {
  slug: LegalDocumentSlug;
  fallbackTitle: string;
}

export default function LegalDocumentRoute({ slug, fallbackTitle }: LegalDocumentRouteProps) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useLegalDocument(slug);

  const title = data?.title || fallbackTitle;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div
        className="sticky top-0 z-10 backdrop-blur-lg bg-background/85 border-b"
        style={{ borderColor: 'var(--outline-border)' }}
      >
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant/10"
            aria-label="뒤로 가기"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">arrow_back</span>
          </button>
          <h1 className="font-headline text-lg font-bold tracking-tight truncate">{title}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-6 pb-16">
        {isLoading ? (
          <div className="surface-card p-10 flex flex-col items-center justify-center gap-3 text-center">
            <div className="h-8 w-8 rounded-full border-4 border-primary/25 border-t-primary animate-spin" />
            <p className="text-sm text-on-surface-variant font-bold">문서를 불러오고 있습니다</p>
          </div>
        ) : isError ? (
          <div className="surface-card p-8 text-center space-y-2">
            <span className="material-symbols-outlined text-[36px] text-error">error</span>
            <p className="font-headline text-base font-bold text-on-surface">문서를 불러오지 못했습니다</p>
            <p className="text-xs text-on-surface-variant break-words">
              {error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.'}
            </p>
          </div>
        ) : !data ? (
          <div className="surface-card p-8 text-center space-y-2">
            <span className="material-symbols-outlined text-[36px] text-on-surface-variant">draft</span>
            <p className="font-headline text-base font-bold text-on-surface">
              아직 게시된 문서가 없습니다
            </p>
            <p className="text-xs text-on-surface-variant">
              관리자 패널의 "약관/방침" 탭에서 문서를 작성해주세요.
            </p>
          </div>
        ) : (
          <>
            <div className="surface-card p-6 mb-6">
              <p className="text-[10px] font-black tracking-[0.22em] text-primary uppercase mb-2">
                Legal Document
              </p>
              <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface mb-3">
                {data.title}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant font-semibold mb-4">
                <span>시행일 · {data.effective_date}</span>
                <span>최종 개정 · {data.updated_at.slice(0, 10)}</span>
              </div>
              {data.intro && (
                <p className="text-sm text-on-surface-variant leading-relaxed">{data.intro}</p>
              )}
            </div>

            <article className="surface-card p-6">
              <LegalMarkdown source={data.body} />
            </article>
          </>
        )}
      </div>
    </div>
  );
}
