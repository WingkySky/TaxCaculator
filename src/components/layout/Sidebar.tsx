import { Calculator, ArrowLeftRight, GitCompare, Calendar, Users } from 'lucide-react';
import clsx from 'clsx';

export type PageType = 'forward' | 'reverse' | 'compare' | 'annual' | 'batch';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

const navItems = [
  { id: 'forward' as const, label: '正向测算', icon: Calculator },
  { id: 'reverse' as const, label: '反向推算', icon: ArrowLeftRight },
  { id: 'compare' as const, label: '对比分析', icon: GitCompare },
  { id: 'annual' as const, label: '年度汇算', icon: Calendar },
  { id: 'batch' as const, label: '批量计算', icon: Users },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 border-r flex flex-col"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
          劳务报酬个税计算器
        </h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                    isActive
                      ? 'font-medium'
                      : 'hover:opacity-80'
                  )}
                  style={{
                    backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--color-text)',
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
        v0.1.0
      </div>
    </aside>
  );
}