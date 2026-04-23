import { ReactNode } from 'react';
import clsx from 'clsx';

interface TableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export default function Table({ headers, children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={clsx('w-full border-collapse rounded-lg overflow-hidden', className)}
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-sm font-medium"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}

interface TableRowProps {
  children: ReactNode;
  index?: number;
}

export function TableRow({ children, index = 0 }: TableRowProps) {
  return (
    <tr
      className="transition-colors hover:opacity-80"
      style={{
        backgroundColor: index % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TableCell({ children, className, style }: TableCellProps) {
  return (
    <td
      className={clsx('px-4 py-3 text-sm', className)}
      style={{ borderColor: 'var(--color-border)', ...style }}
    >
      {children}
    </td>
  );
}