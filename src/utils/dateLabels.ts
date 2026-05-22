const ONE_DAY_MS = 1000 * 60 * 60 * 24;

function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export function formatKoreanDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export function diffDaysBetween(targetDateStr: string, todayStr: string): number {
  const target = parseLocalDate(targetDateStr).getTime();
  const today = parseLocalDate(todayStr).getTime();
  return Math.round((target - today) / ONE_DAY_MS);
}
