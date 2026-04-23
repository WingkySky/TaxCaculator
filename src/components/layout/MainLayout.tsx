import { ReactNode } from 'react';
import Sidebar, { PageType } from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

export default function MainLayout({ children, currentPage, onNavigate }: MainLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      <div
        className="ml-60 flex flex-col"
        style={{ minHeight: '100vh' }}
      >
        <Header currentPage={currentPage} />

        <main
          className="flex-1 p-6"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}