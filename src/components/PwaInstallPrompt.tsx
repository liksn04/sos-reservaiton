import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, MonitorSmartphone, PlusSquare, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

const INSTALL_PROMPT_DISMISSED_UNTIL = 'bss:pwa-install-card-dismissed-until';
const INSTALL_PROMPT_ACCEPTED = 'bss:pwa-install-accepted';
const DISMISS_DAYS = 7;

function isPwaDisplayMode() {
  if (typeof window === 'undefined') return true;

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

function isIosBrowser() {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
  const isAppleTouchMac = userAgent.includes('macintosh') && 'ontouchend' in document;
  return isIOSDevice || isAppleTouchMac;
}

function isAndroidBrowser() {
  if (typeof window === 'undefined') return false;

  return window.navigator.userAgent.toLowerCase().includes('android');
}

function isKakaoTalkBrowser() {
  if (typeof window === 'undefined') return false;

  return window.navigator.userAgent.toLowerCase().includes('kakaotalk');
}

function getDismissedUntil() {
  const value = window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_UNTIL);
  return value ? Number(value) : 0;
}

function dismissForAWeek() {
  const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_UNTIL, String(until));
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos] = useState(() => isIosBrowser());
  const [isAndroid] = useState(() => isAndroidBrowser());
  const [isKakaoTalk] = useState(() => isKakaoTalkBrowser());
  const [isStandalone] = useState(() => isPwaDisplayMode());

  const hasNativeInstall = deferredPrompt !== null;

  const shouldShow = useMemo(() => {
    if (isStandalone) return false;
    if (!visible) return false;
    return true;
  }, [isStandalone, visible]);

  const close = useCallback(() => {
    dismissForAWeek();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (isPwaDisplayMode()) return;
    if (window.localStorage.getItem(INSTALL_PROMPT_ACCEPTED) === 'true') return;
    if (getDismissedUntil() > Date.now()) return;

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 1200);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      window.localStorage.setItem(INSTALL_PROMPT_ACCEPTED, 'true');
      setDeferredPrompt(null);
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === 'accepted') {
      window.localStorage.setItem(INSTALL_PROMPT_ACCEPTED, 'true');
      setVisible(false);
      return;
    }

    close();
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.section
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 14, opacity: 0 }}
          className="surface-card mb-8 overflow-hidden p-0"
          role="region"
          aria-labelledby="pwa-install-title"
        >
          <div className="flex items-start gap-3 px-5 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] bg-primary/10 text-primary">
              {hasNativeInstall ? (
                <Download className="h-5 w-5" />
              ) : (
                <MonitorSmartphone className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="club-tag !mb-0 !px-2.5 !py-1 text-[10px]">앱 설치 안내</p>
                {isKakaoTalk ? (
                  <span className="rounded-full bg-warning-container px-2 py-0.5 text-[10px] font-black text-warning">
                    KAKAO
                  </span>
                ) : null}
                <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-black text-on-surface-variant">
                  WEB
                </span>
              </div>
              <h2 id="pwa-install-title" className="font-headline text-lg font-black tracking-tight text-on-surface">
                빛소리를 앱처럼 사용하세요
              </h2>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-on-surface-variant">
                홈 화면에서 바로 열고 예약 현황을 빠르게 확인할 수 있습니다. 알림 기능을 사용하려면 앱으로 전환해 주세요.
              </p>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:text-on-surface"
              onClick={close}
              aria-label="설치 안내 닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-t border-card-border px-5 py-4">
            {isKakaoTalk ? (
              <div className="rounded-[1.25rem] border border-warning/20 bg-warning-container/20 px-3 py-3">
                <p className="mb-2 text-xs font-black text-warning">카카오톡에서는 외부 브라우저로 열어주세요</p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-container text-warning">
                      <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                    </span>
                    <span className="text-xs font-black leading-4 text-on-surface">더보기</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-warning/70">chevron_right</span>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-container text-warning">
                      <MonitorSmartphone className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-black leading-4 text-on-surface">
                      {isIos ? 'Safari에서 열기' : 'Chrome에서 열기'}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-on-surface-variant">
                  외부 브라우저에서 다시 열면 홈 화면 추가 또는 앱 설치 안내가 정상적으로 표시됩니다.
                </p>
              </div>
            ) : null}

            {hasNativeInstall && !isIos && !isKakaoTalk ? (
              <button
                type="button"
                className="primary-btn flex w-full items-center justify-center gap-2 !py-3"
                onClick={handleInstall}
              >
                <Download className="h-4 w-4" />
                앱 설치하기
              </button>
            ) : null}

            {isKakaoTalk ? null : isIos ? (
              <div className="rounded-[1.25rem] border border-primary/15 bg-primary/5 px-3 py-3">
                <p className="mb-3 text-xs font-black text-primary">iPhone 설치 방법</p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Share className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-black leading-4 text-on-surface">공유</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-primary/70">chevron_right</span>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <PlusSquare className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-black leading-4 text-on-surface">홈 화면에 추가</span>
                  </div>
                </div>
              </div>
            ) : isAndroid ? (
              <div className={hasNativeInstall ? 'mt-3 rounded-[1.25rem] border border-primary/15 bg-primary/5 px-3 py-3' : 'rounded-[1.25rem] border border-primary/15 bg-primary/5 px-3 py-3'}>
                <p className="mb-1 text-xs font-black text-primary">Android 설치 방법</p>
                <p className="mb-3 text-xs font-semibold leading-5 text-on-surface-variant">Chrome 브라우저에서만 앱 설치가 가능합니다.</p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-[16px]">more_vert</span>
                    </span>
                    <span className="text-xs font-black leading-4 text-on-surface">Chrome 메뉴</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-primary/70">chevron_right</span>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Download className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-black leading-4 text-on-surface">홈 화면에 추가</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={hasNativeInstall ? 'mt-3 grid gap-2 sm:grid-cols-2' : 'grid gap-2 sm:grid-cols-2'}>
                <div className="rounded-[1.25rem] border border-primary/15 bg-primary/5 px-3 py-3">
                  <p className="mb-2 text-xs font-black text-primary">iPhone</p>
                  <div className="flex items-center gap-2 text-xs font-black text-on-surface">
                    <Share className="h-4 w-4 shrink-0 text-primary" />
                    <span>공유</span>
                    <span className="material-symbols-outlined text-[16px] text-primary/70">chevron_right</span>
                    <span>홈 화면에 추가</span>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-primary/15 bg-primary/5 px-3 py-3">
                  <p className="mb-2 text-xs font-black text-primary">Android</p>
                  <p className="mb-2 text-xs font-semibold leading-5 text-on-surface-variant">Chrome 브라우저 필수</p>
                  <div className="flex items-center gap-2 text-xs font-black text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-primary">more_vert</span>
                    <span>Chrome 메뉴</span>
                    <span className="material-symbols-outlined text-[16px] text-primary/70">chevron_right</span>
                    <span>홈 화면에 추가</span>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold leading-5 text-on-surface-variant">
              <MonitorSmartphone className="h-4 w-4 shrink-0 text-primary" />
              <span>앱으로 이미 실행 중이면 이 카드는 표시되지 않습니다.</span>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
