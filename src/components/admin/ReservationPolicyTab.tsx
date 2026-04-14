import { useMemo, useState } from 'react';
import {
  useCreateReservationPolicySeason,
  useDeleteReservationPolicySeason,
  useUpdateReservationPolicySeason,
} from '../../hooks/mutations/useReservationPolicySeasonMutations';
import { useReservationPolicySeasons } from '../../hooks/useReservationPolicySeasons';
import { useToast } from '../../contexts/useToast';
import { hasReservationPolicyTableMissingDetected } from '../../utils/reservationPolicyFeature';
import {
  findActiveReservationPolicySeason,
  sanitizeReservationPolicySeasonInput,
  validateReservationPolicySeasonInput,
} from '../../utils/reservationPolicy';
import { formatDate } from '../../utils/time';
import type { ReservationPolicySeason, ReservationPolicySeasonInput } from '../../types';

type SeasonStatus = 'active' | 'upcoming' | 'ended' | 'inactive';

function createDefaultForm(today: string): ReservationPolicySeasonInput {
  return {
    name: '',
    start_date: today,
    end_date: today,
    note: '',
    is_active: true,
  };
}

function getSeasonStatus(season: ReservationPolicySeason, today: string): SeasonStatus {
  if (!season.is_active) return 'inactive';
  if (season.end_date < today) return 'ended';
  if (season.start_date > today) return 'upcoming';
  return 'active';
}

function getSeasonStatusLabel(status: SeasonStatus): string {
  switch (status) {
    case 'active':
      return '진행 중';
    case 'upcoming':
      return '예정됨';
    case 'ended':
      return '종료됨';
    case 'inactive':
      return '비활성';
    default:
      return '미분류';
  }
}

function getSeasonStatusClassName(status: SeasonStatus): string {
  switch (status) {
    case 'active':
      return 'bg-primary text-white border-primary/20';
    case 'upcoming':
      return 'bg-tertiary/15 text-tertiary border-tertiary/20';
    case 'ended':
      return 'bg-surface-container-high text-on-surface-variant border-card-border';
    case 'inactive':
      return 'bg-error/10 text-error border-error/20';
    default:
      return 'bg-surface-container-high text-on-surface-variant border-card-border';
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '예약 정책 시즌 처리 중 오류가 발생했습니다.';
}

export default function ReservationPolicyTab() {
  const today = formatDate(new Date());
  const { addToast } = useToast();
  const { data: seasons = [], isLoading } = useReservationPolicySeasons({ includeInactive: true });
  const createSeason = useCreateReservationPolicySeason();
  const updateSeason = useUpdateReservationPolicySeason();
  const deleteSeason = useDeleteReservationPolicySeason();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReservationPolicySeasonInput>(() => createDefaultForm(today));

  const isSubmitting = createSeason.isPending || updateSeason.isPending;
  const isFeatureUnavailable = hasReservationPolicyTableMissingDetected();
  const activeSeason = useMemo(
    () => findActiveReservationPolicySeason(seasons, today),
    [seasons, today],
  );

  function resetForm() {
    setEditingId(null);
    setForm(createDefaultForm(today));
  }

  function handleEdit(season: ReservationPolicySeason) {
    setEditingId(season.id);
    setForm({
      name: season.name,
      start_date: season.start_date,
      end_date: season.end_date,
      note: season.note ?? '',
      is_active: season.is_active,
    });
  }

  function updateForm<K extends keyof ReservationPolicySeasonInput>(
    key: K,
    value: ReservationPolicySeasonInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateReservationPolicySeasonInput(form, seasons, editingId);
    if (validationError) {
      addToast(validationError, 'error');
      return;
    }

    const sanitized = sanitizeReservationPolicySeasonInput(form);

    try {
      if (editingId) {
        await updateSeason.mutateAsync({ id: editingId, ...sanitized });
        addToast('예약 정책 시즌이 수정되었습니다.', 'success');
      } else {
        await createSeason.mutateAsync(sanitized);
        addToast('예약 정책 시즌이 추가되었습니다.', 'success');
      }

      resetForm();
    } catch (error) {
      console.error(error);
      addToast(getErrorMessage(error), 'error');
    }
  }

  async function handleDelete(season: ReservationPolicySeason) {
    if (!confirm(`[${season.name}] 시즌을 삭제하시겠습니까?`)) return;

    try {
      await deleteSeason.mutateAsync(season.id);
      if (editingId === season.id) {
        resetForm();
      }
      addToast('예약 정책 시즌이 삭제되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      addToast(getErrorMessage(error), 'error');
    }
  }

  if (isLoading) return <LoadingCard />;
  if (isFeatureUnavailable) return <MissingMigrationCard />;

  return (
    <div className="flex flex-col gap-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="club-tag mb-2">당일 예약 예외</div>
            <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
              합주 당일 예약 시즌
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              어드민이 지정한 기간에만 합주 카테고리의 오늘 예약을 예외적으로 허용합니다.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-card-border bg-surface-container-low px-4 py-3 text-sm">
            <p className="font-bold text-on-surface">현재 적용 상태</p>
            <p className="mt-1 text-on-surface-variant">
              {activeSeason
                ? `${activeSeason.name} (${activeSeason.start_date} ~ ${activeSeason.end_date})`
                : '진행 중인 당일 예약 허용 시즌이 없습니다.'}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h4 className="text-lg font-black text-on-surface">
              {editingId ? '시즌 수정' : '시즌 추가'}
            </h4>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">
              활성화된 시즌은 서로 겹칠 수 없고, 오늘 날짜가 시즌 안에 있으면 당일 예약이 허용됩니다.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              className="secondary-btn !h-10 !px-4"
              onClick={resetForm}
            >
              새로 작성
            </button>
          )}
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>시즌 이름</label>
            <input
              type="text"
              value={form.name}
              maxLength={60}
              placeholder="예: 축제 주간 특별 운영"
              onChange={(event) => updateForm('name', event.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>시작일</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(event) => updateForm('start_date', event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>종료일</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(event) => updateForm('end_date', event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>운영 메모</label>
            <textarea
              rows={3}
              value={form.note ?? ''}
              maxLength={200}
              placeholder="예: 시험 기간 운영 정책으로 당일 합주 예약 허용"
              onChange={(event) => updateForm('note', event.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[1.5rem] border border-card-border bg-surface-container-low px-4 py-4">
            <span className="text-sm font-bold text-on-surface">이 시즌을 활성 상태로 저장</span>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => updateForm('is_active', event.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="relative inline-flex h-7 w-12 shrink-0 rounded-full border border-input-border bg-surface-container-high transition-colors before:absolute before:left-1 before:top-1/2 before:h-5 before:w-5 before:-translate-y-1/2 before:rounded-full before:bg-white before:shadow-sm before:transition-all peer-checked:border-primary peer-checked:bg-primary/20 peer-checked:before:translate-x-5 peer-checked:before:bg-primary"
            />
          </label>

          <div className="form-actions !mt-2">
            <button
              type="submit"
              className="primary-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? '저장 중...' : editingId ? '시즌 수정하기' : '시즌 추가하기'}
            </button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        {seasons.length === 0 ? (
          <EmptyCard />
        ) : (
          seasons.map((season) => {
            const status = getSeasonStatus(season, today);

            return (
              <article
                key={season.id}
                className="surface-card p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-black text-on-surface">{season.name}</h4>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${getSeasonStatusClassName(status)}`}>
                        {getSeasonStatusLabel(status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-on-surface-variant">
                      {season.start_date} ~ {season.end_date}
                    </p>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      {season.note ?? '등록된 운영 메모가 없습니다.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="secondary-btn !h-10 !px-4"
                      onClick={() => handleEdit(season)}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="secondary-btn !h-10 !px-4 !text-error"
                      onClick={() => handleDelete(season)}
                      disabled={deleteSeason.isPending}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-surface-container-low border border-card-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-bold opacity-60">예약 정책을 불러오는 중...</p>
    </div>
  );
}

function EmptyCard() {
  return (
    <div className="bg-surface-container-low border border-card-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 opacity-70">
      <span className="material-symbols-outlined text-5xl opacity-20">event_busy</span>
      <p className="text-sm font-bold">등록된 예약 정책 시즌이 없습니다.</p>
    </div>
  );
}

function MissingMigrationCard() {
  return (
    <div className="bg-surface-container-low border border-error/20 rounded-[2.5rem] p-8 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-error">
        <span className="material-symbols-outlined">warning</span>
        <p className="text-base font-black">예약 정책 기능을 아직 사용할 수 없습니다.</p>
      </div>
      <p className="text-sm text-on-surface-variant">
        현재 연결된 Supabase DB에 `reservation_policy_seasons` 테이블이 없어 조회가 비활성화되었습니다.
      </p>
      <p className="text-sm text-on-surface-variant">
        `supabase/migrations/0009_reservation_policy_seasons.sql` 마이그레이션을 적용한 뒤 새로고침하면 정상 동작합니다.
      </p>
    </div>
  );
}
