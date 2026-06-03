import type { CSSProperties, HTMLAttributes } from 'react';

type MaterialIconSpanProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'dangerouslySetInnerHTML'>;

interface MaterialIconProps extends MaterialIconSpanProps {
  name: string;
  filled?: boolean;
}

export default function MaterialIcon({
  name,
  className = '',
  filled = false,
  style,
  'aria-hidden': ariaHidden = true,
  ...props
}: MaterialIconProps) {
  const iconStyle: CSSProperties | undefined = filled
    ? { ...style, fontVariationSettings: "'FILL' 1" }
    : style;
  const classes = ['material-symbols-outlined', className].filter(Boolean).join(' ');

  return (
    <span
      {...props}
      aria-hidden={ariaHidden}
      className={classes}
      data-icon={name}
      style={iconStyle}
    />
  );
}
