import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Card({ title, children, className }: CardProps) {
  return (
    <div
      className={clsx('rounded-xl shadow-sm border', className)}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {title && (
        <div
          className="px-6 py-4 border-b font-medium"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          {title}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}