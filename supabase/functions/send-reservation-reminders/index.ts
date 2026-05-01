// @ts-expect-error: Supabase Edge Functions resolve npm: imports in the Deno runtime.
import { createClient } from 'npm:@supabase/supabase-js@2';
// @ts-expect-error: Supabase Edge Functions resolve npm: imports in the Deno runtime.
import webpush from 'npm:web-push@3.6.7';

interface DenoEnv {
  get(name: string): string | undefined;
}

interface DenoGlobal {
  env: DenoEnv;
  serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare const Deno: DenoGlobal;

type ReminderType = 'two_hours' | 'thirty_minutes';

interface ReservationRow {
  id: string;
  date: string;
  start_time: string;
  team_name: string;
  host_id: string;
  host: { display_name: string } | null;
  reservation_invitees: Array<{ user_id: string }>;
}

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface DeliveryRow {
  user_id: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

const TWO_HOUR_MINUTES = 120;
const THIRTY_MINUTES = 30;
const WINDOW_MINUTES = 5;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} 환경 변수가 설정되지 않았습니다.`);
  return value;
}

function formatKstDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function getReservationStartAt(reservation: ReservationRow) {
  return new Date(`${reservation.date}T${normalizeTime(reservation.start_time)}:00+09:00`);
}

function getDueReminderType(startAt: Date, now: Date): ReminderType | null {
  const minutesUntilStart = (startAt.getTime() - now.getTime()) / 60000;

  if (
    minutesUntilStart >= TWO_HOUR_MINUTES - WINDOW_MINUTES &&
    minutesUntilStart < TWO_HOUR_MINUTES + WINDOW_MINUTES
  ) {
    return 'two_hours';
  }

  if (
    minutesUntilStart >= THIRTY_MINUTES - WINDOW_MINUTES &&
    minutesUntilStart < THIRTY_MINUTES + WINDOW_MINUTES
  ) {
    return 'thirty_minutes';
  }

  return null;
}

function getRecipientIds(reservation: ReservationRow) {
  return [...new Set([
    reservation.host_id,
    ...(reservation.reservation_invitees ?? []).map((invitee) => invitee.user_id),
  ])];
}

function getBody(reservation: ReservationRow) {
  const hostName = reservation.host?.display_name ?? '예약자';
  return `오늘 ${normalizeTime(reservation.start_time)} ${reservation.team_name} (${hostName}) 예약이 있습니다.`;
}

const SUPABASE_URL = getRequiredEnv('SUPABASE_URL');
const SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const WEB_PUSH_PUBLIC_KEY = Deno.env.get('WEB_PUSH_PUBLIC_KEY') ?? getRequiredEnv('VAPID_PUBLIC_KEY');
const WEB_PUSH_PRIVATE_KEY = Deno.env.get('WEB_PUSH_PRIVATE_KEY') ?? getRequiredEnv('VAPID_PRIVATE_KEY');
const WEB_PUSH_SUBJECT = Deno.env.get('WEB_PUSH_SUBJECT') ?? 'mailto:admin@example.com';
const CRON_SECRET = Deno.env.get('REMINDER_CRON_SECRET');

webpush.setVapidDetails(WEB_PUSH_SUBJECT, WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'POST 요청만 지원합니다.' }, 405);
    }

    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('x-cron-secret');
    const hasServiceRole = authHeader === `Bearer ${SERVICE_ROLE_KEY}`;
    const hasCronSecret = Boolean(CRON_SECRET) && cronSecret === CRON_SECRET;

    if (!hasServiceRole && !hasCronSecret) {
      return jsonResponse({ error: '리마인더 발송 권한이 없습니다.' }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = new Date();
    const rangeEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const { data: reservations, error: reservationsError } = await admin
      .from('reservations')
      .select(`
        id,
        date,
        start_time,
        team_name,
        host_id,
        host:profiles!host_id(display_name),
        reservation_invitees(user_id)
      `)
      .gte('date', formatKstDate(now))
      .lte('date', formatKstDate(rangeEnd));

    if (reservationsError) throw reservationsError;

    const dueReservations = ((reservations ?? []) as unknown as ReservationRow[])
      .map((reservation) => {
        const startAt = getReservationStartAt(reservation);
        return {
          reservation,
          reminderType: getDueReminderType(startAt, now),
          startAt,
        };
      })
      .filter((item): item is { reservation: ReservationRow; reminderType: ReminderType; startAt: Date } =>
        item.reminderType !== null,
      );

    const userIds = [...new Set(dueReservations.flatMap(({ reservation }) => getRecipientIds(reservation)))];

    if (dueReservations.length === 0 || userIds.length === 0) {
      return jsonResponse({ ok: true, scanned: reservations?.length ?? 0, sent: 0 });
    }

    const { data: subscriptions, error: subscriptionsError } = await admin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', userIds);

    if (subscriptionsError) throw subscriptionsError;

    const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>();
    for (const subscription of (subscriptions ?? []) as PushSubscriptionRow[]) {
      const current = subscriptionsByUser.get(subscription.user_id) ?? [];
      current.push(subscription);
      subscriptionsByUser.set(subscription.user_id, current);
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const { reservation, reminderType, startAt } of dueReservations) {
      const recipientIds = getRecipientIds(reservation);
      const alreadySentTwoHour = reminderType === 'thirty_minutes'
        ? await getSentTwoHourRecipients(admin, reservation.id, startAt.toISOString(), recipientIds)
        : new Set<string>();

      for (const userId of recipientIds) {
        if (alreadySentTwoHour.has(userId)) {
          skipped += 1;
          continue;
        }

        const userSubscriptions = subscriptionsByUser.get(userId) ?? [];
        if (userSubscriptions.length === 0) {
          skipped += 1;
          continue;
        }

        const delivery = await claimDelivery(admin, reservation.id, userId, reminderType, startAt.toISOString());
        if (!delivery) {
          skipped += 1;
          continue;
        }

        const result = await sendToSubscriptions(admin, userSubscriptions, {
          title: '예약 알림',
          body: getBody(reservation),
          reservationId: reservation.id,
          url: `/reserve?reservation=${reservation.id}`,
        });

        if (result.successCount > 0) {
          sent += result.successCount;
          await markDelivery(admin, delivery.id, 'sent', result.successCount + result.failureCount, null);
        } else {
          failed += 1;
          await markDelivery(admin, delivery.id, 'failed', result.failureCount, result.lastError);
        }
      }
    }

    return jsonResponse({ ok: true, scanned: reservations?.length ?? 0, sent, skipped, failed });
  } catch (error) {
    console.error('send-reservation-reminders error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});

async function getSentTwoHourRecipients(
  admin: ReturnType<typeof createClient>,
  reservationId: string,
  startAt: string,
  userIds: string[],
) {
  const { data, error } = await admin
    .from('reservation_reminder_deliveries')
    .select('user_id')
    .eq('reservation_id', reservationId)
    .eq('reservation_start_at', startAt)
    .eq('reminder_type', 'two_hours')
    .eq('status', 'sent')
    .in('user_id', userIds);

  if (error) throw error;

  return new Set(((data ?? []) as DeliveryRow[]).map((delivery) => delivery.user_id));
}

async function claimDelivery(
  admin: ReturnType<typeof createClient>,
  reservationId: string,
  userId: string,
  reminderType: ReminderType,
  startAt: string,
) {
  const { data, error } = await admin
    .from('reservation_reminder_deliveries')
    .insert({
      reservation_id: reservationId,
      user_id: userId,
      reminder_type: reminderType,
      reservation_start_at: startAt,
      status: 'pending',
    })
    .select('id')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return null;
    throw error;
  }

  return data as { id: string } | null;
}

async function markDelivery(
  admin: ReturnType<typeof createClient>,
  deliveryId: string,
  status: 'sent' | 'failed',
  attempts: number,
  lastError: string | null,
) {
  const { error } = await admin
    .from('reservation_reminder_deliveries')
    .update({
      status,
      attempts,
      last_error: lastError,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    })
    .eq('id', deliveryId);

  if (error) throw error;
}

async function sendToSubscriptions(
  admin: ReturnType<typeof createClient>,
  subscriptions: PushSubscriptionRow[],
  payload: Record<string, string>,
) {
  let successCount = 0;
  let failureCount = 0;
  let lastError: string | null = null;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      }, JSON.stringify(payload));
      successCount += 1;
    } catch (error) {
      failureCount += 1;
      lastError = error instanceof Error ? error.message : String(error);

      const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
        ? Number((error as { statusCode: unknown }).statusCode)
        : null;

      if (statusCode === 404 || statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', subscription.id);
      }
    }
  }

  return { successCount, failureCount, lastError };
}
