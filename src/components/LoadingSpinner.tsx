interface LoadingSpinnerProps {
  /** 스피너 크기: sm (24px), md (40px), lg (56px) */
  size?: 'sm' | 'md' | 'lg';
  /** 화면이나 카드 정중앙에 위치시킬지 여부 */
  center?: boolean;
  /** 전체 화면(로딩 스크린)으로 덮을지 여부 */
  fullScreen?: boolean;
  /** 스피너 아래에 노출할 메시지 텍스트 */
  label?: string;
  /** 추가 클래스 */
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  center = true,
  fullScreen = false,
  label,
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-14 w-14 border-4',
  };

  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`rounded-full border-primary/20 border-t-primary animate-spin ${sizeClasses[size]}`}
        role="status"
        aria-label="로딩 중"
      />
      {label && (
        <p className="mt-3 text-sm font-semibold text-on-surface-variant animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinnerElement}
      </div>
    );
  }

  if (center) {
    return (
      <div className="flex w-full items-center justify-center p-8">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
}
