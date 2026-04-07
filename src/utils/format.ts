/**
 * 금액을 한국 통화 형식으로 변환합니다.
 * @param amount 변환할 금액 (숫자)
 * @returns 변환된 문자열 (예: 1,000,000원)
 */
export const formatCurrency = (amount: number): string => {
  if (amount === undefined || amount === null) return '0원';
  return `${amount.toLocaleString()}원`;
};
