import { useCallback, useMemo, useState } from 'react';
import { Bell, BellOff, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../contexts/useToast';
import { useReservationPushSubscription } from '../hooks/useReservationPushSubscription';

type PromptMode = 'first-run' | 'settings';

interface Props {
  mode?: PromptMode;
}

const DISMISSED_KEY = 'bss:reservation-push-first-run-dismissed';

export default function ReservationNotificationPrompt({ mode = 'settings' }: Props) {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const { disable, enable, isPending, status } = useReservationPushSubscription(profile?.id);
  const [dismissed, setDismissed] = useState(() => window.localStorage.getItem(DISMISSED_KEY) === 'true');

  const isFirstRun = mode === 'first-run';
  const visible = useMemo(() => {
    if (!profile) return false;
    if (!isFirstRun) return true;
    if (dismissed) return false;
    return status === 'disabled' || status === 'not-installed' || status === 'missing-key';
  }, [dismissed, isFirstRun, profile, status]);

  const copy = getStatusCopy(status);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }, []);

  async function handleEnable() {
    try {
      await enable();
      addToast('예약 알림이 켜졌습니다.', 'success');
    } catch {
      addToast('예약 알림을 켜지 못했습니다. 잠시 후 다시 시도해주세요.', 'error');
    }
  }

  async function handleDisable() {
    try {
      await disable();
      addToast('예약 알림이 꺼졌습니다.', 'success');
    } catch {
      addToast('예약 알림 설정을 변경하지 못했습니다.', 'error');
    }
  }

  if (!visible) return null;

  return (
    <section
      className={`surface-card ${isFirstRun ? 'mb-6 p-5' : 'mb-8 p-5'}`}
      role="region"
      aria-labelledby={isFirstRun ? 'first-run-push-title' : 'profile-push-title'}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] bg-primary/10 text-primary">
          {status === 'enabled' ? <Bell className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="club-tag !mb-0 !px-2.5 !py-1 text-[10px]">예약 알림</p>
            <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-black text-on-surface-variant">
              PWA PUSH
            </span>
          </div>
          <h2
            id={isFirstRun ? 'first-run-push-title' : 'profile-push-title'}
            className="font-headline text-lg font-black tracking-tight text-on-surface"
          >
            {copy.title}
          </h2>
          <p className="mt-1.5 text-sm font-semibold leading-6 text-on-surface-variant">
            {copy.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {status === 'enabled' ? (
          <button
            type="button"
            className="secondary-btn flex w-full items-center justify-center gap-2 !py-3"
            onClick={handleDisable}
            disabled={isPending}
          >
            <BellOff className="h-4 w-4" />
            알림 끄기
          </button>
        ) : (
          <button
            type="button"
            className="primary-btn flex w-full items-center justify-center gap-2 !py-3"
            onClick={handleEnable}
            disabled={isPending || status !== 'disabled'}
          >
            <Bell className="h-4 w-4" />
            예약 알림 켜기
          </button>
        )}

        {isFirstRun ? (
          <button
            type="button"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-card-border bg-surface-container-low px-4 text-sm font-black text-on-surface-variant"
            onClick={dismiss}
          >
            나중에
          </button>
        ) : null}
      </div>
    </section>
  );
}

function getStatusCopy(status: string) {
  switch (status) {
    case 'enabled':
      return {
        title: '예약 2시간 전 알림이 켜져 있습니다',
        description: '호스트이거나 초대된 예약이 있으면 시작 2시간 전, 늦은 초대는 30분 전에 푸시를 보냅니다.',
      };
    case 'not-installed':
      return {
        title: '홈 화면 앱에서 알림을 켤 수 있습니다',
        description: 'iPhone에서는 Safari에서 홈 화면에 추가한 뒤 앱 아이콘으로 열어야 예약 푸시를 받을 수 있습니다.',
      };
    case 'missing-key':
      return {
        title: '알림 서버 설정이 필요합니다',
        description: '운영 환경에 VAPID 공개키가 아직 연결되지 않아 푸시 구독을 만들 수 없습니다.',
      };
    case 'blocked':
      return {
        title: '브라우저에서 알림이 차단되어 있습니다',
        description: '기기 설정에서 빛소리 알림 권한을 허용한 뒤 다시 시도해주세요.',
      };
    case 'unsupported':
      return {
        title: '이 환경은 PWA 푸시를 지원하지 않습니다',
        description: 'iOS 16.4 이상 홈 화면 앱 또는 Android Chrome PWA 환경에서 사용할 수 있습니다.',
      };
    default:
      return {
        title: '예약 시작 전에 푸시 알림 받기',
        description: '예약 호스트와 초대자는 시작 2시간 전 알림을 받고, 늦은 예약은 30분 전 알림을 받습니다.',
      };
  }
}
