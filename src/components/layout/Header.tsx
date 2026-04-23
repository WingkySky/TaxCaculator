import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PageType } from './Sidebar';

const pageTitles: Record<PageType, string> = {
  forward: '正向测算',
  reverse: '反向推算',
  compare: '对比分析',
  annual: '年度汇算',
};

interface HeaderProps {
  currentPage: PageType;
}

export default function Header({ currentPage }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="h-16 border-b flex items-center justify-between px-6"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
        {pageTitles[currentPage]}
      </h2>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:opacity-80 transition-opacity"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          color: 'var(--color-text)',
        }}
        aria-label="切换主题"
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>
    </header>
  );
}