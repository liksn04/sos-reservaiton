/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

interface ReservationPushPayload {
  title?: string;
  body?: string;
  reservationId?: string;
  url?: string;
}

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event.data);
  const reservationId = payload.reservationId;
  const targetUrl = payload.url ?? (reservationId ? `/reserve?reservation=${reservationId}` : '/reserve');

  event.waitUntil(
    self.registration.showNotification(payload.title ?? '예약 알림', {
      body: payload.body ?? '곧 시작되는 예약이 있습니다.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: reservationId ? `reservation-${reservationId}` : 'reservation-reminder',
      data: { url: targetUrl },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = typeof event.notification.data?.url === 'string'
    ? event.notification.data.url
    : '/reserve';

  event.waitUntil(openOrFocusClient(targetUrl));
});

function parsePushPayload(data: PushMessageData | null): ReservationPushPayload {
  if (!data) return {};

  try {
    return data.json() as ReservationPushPayload;
  } catch {
    return { body: data.text() };
  }
}

async function openOrFocusClient(targetUrl: string) {
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

  for (const client of windows) {
    if ('focus' in client) {
      await client.navigate(absoluteUrl);
      return client.focus();
    }
  }

  return self.clients.openWindow(absoluteUrl);
}
