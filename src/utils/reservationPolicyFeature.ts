const RESERVATION_POLICY_TABLE_NAME = 'reservation_policy_seasons';

let hasWarnedMissingReservationPolicyTable = false;
let hasDetectedMissingReservationPolicyTable = false;

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const message = Reflect.get(error, 'message');
    if (typeof message === 'string') {
      return message;
    }
  }

  return '';
}

function readErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const code = Reflect.get(error, 'code');
    if (typeof code === 'string') {
      return code;
    }
  }

  return '';
}

function readErrorStatus(error: unknown): number | null {
  if (typeof error === 'object' && error !== null) {
    const status = Reflect.get(error, 'status');
    if (typeof status === 'number') {
      return status;
    }
  }

  return null;
}

export function isReservationPolicyTableMissingError(error: unknown): boolean {
  const message = readErrorMessage(error).toLowerCase();
  const code = readErrorCode(error).toUpperCase();
  const status = readErrorStatus(error);

  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    status === 404 ||
    message.includes(RESERVATION_POLICY_TABLE_NAME) ||
    message.includes('schema cache')
  );
}

export function markReservationPolicyTableMissing(error: unknown): boolean {
  if (!isReservationPolicyTableMissingError(error)) {
    return false;
  }

  hasDetectedMissingReservationPolicyTable = true;

  if (!hasWarnedMissingReservationPolicyTable) {
    console.warn(
      '[ReservationPolicy] reservation_policy_seasons 테이블이 아직 없어 기본 정책으로 동작합니다. DB 마이그레이션을 적용해주세요.',
    );
    hasWarnedMissingReservationPolicyTable = true;
  }

  return true;
}

export function hasReservationPolicyTableMissingDetected(): boolean {
  return hasDetectedMissingReservationPolicyTable;
}

export function normalizeReservationPolicyFeatureError(error: unknown): Error {
  if (isReservationPolicyTableMissingError(error)) {
    return new Error(
      '예약 정책 시즌 기능을 사용하려면 Supabase 마이그레이션 `0009_reservation_policy_seasons.sql`을 먼저 적용해주세요.',
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('예약 정책 시즌 처리 중 알 수 없는 오류가 발생했습니다.');
}
