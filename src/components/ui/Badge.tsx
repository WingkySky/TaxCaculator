import { ReactNode } from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const colorMap = {
  primary: {
    bg: 'var(--color-primary)',
    text: '#ffffff',
  },
  success: {
    bg: 'var(--color-accent)',
    text: '#ffffff',
  },
  warning: {
    bg: 'var(--color-warning)',
    text: '#ffffff',
  },
  danger: {
    bg: 'var(--color-danger)',
    text: '#ffffff',
  },
};

export default function Badge({ children, color = 'primary', className }: BadgeProps) {
  return (
    <span
      className={clsx('inline-flex items-center px-2 py-1 rounded text-xs font-medium', className)}
      style={{
        backgroundColor: colorMap[color].bg,
        color: colorMap[color].text,
      }}
    >
      {children}
    </span>
  );
}