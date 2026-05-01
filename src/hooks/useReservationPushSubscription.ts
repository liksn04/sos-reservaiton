import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  getNotificationPermission,
  getPushSubscriptionKeys,
  isPushSupported,
  isPwaStandalone,
  urlBase64ToUint8Array,
} from '../utils/pushNotifications';

type PushStatus = 'loading' | 'unsupported' | 'not-installed' | 'missing-key' | 'blocked' | 'disabled' | 'enabled';

const publicVapidKey = (
  import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY ?? import.meta.env.VITE_VAPID_PUBLIC_KEY
) as string | undefined;

export function useReservationPushSubscription(userId: string | undefined) {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [isPending, setIsPending] = useState(false);

  const canRequest = useMemo(() => {
    return status === 'disabled' || status === 'enabled';
  }, [status]);

  const refreshStatus = useCallback(async () => {
    if (!userId) {
      setStatus('loading');
      return;
    }

    if (!isPushSupported()) {
      setStatus('unsupported');
      return;
    }

    if (!isPwaStandalone()) {
      setStatus('not-installed');
      return;
    }

    if (!publicVapidKey) {
      setStatus('missing-key');
      return;
    }

    const permission = getNotificationPermission();
    if (permission === 'denied') {
      setStatus('blocked');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setStatus(subscription ? 'enabled' : 'disabled');
  }, [userId]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const enable = useCallback(async () => {
    if (!userId || !publicVapidKey) return;

    setIsPending(true);
    try {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission === 'denied') {
          setStatus('blocked');
          return;
        }
        if (permission !== 'granted') {
          setStatus('disabled');
          return;
        }
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
      const { p256dh, auth } = getPushSubscriptionKeys(subscription);

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
      }, { onConflict: 'endpoint' });

      if (error) throw error;
      setStatus('enabled');
    } finally {
      setIsPending(false);
    }
  }, [userId]);

  const disable = useCallback(async () => {
    if (!userId || !isPushSupported()) return;

    setIsPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', endpoint);

        if (error) throw error;
      }

      setStatus('disabled');
    } finally {
      setIsPending(false);
    }
  }, [userId]);

  return {
    canRequest,
    disable,
    enable,
    isPending,
    refreshStatus,
    status,
  };
}
