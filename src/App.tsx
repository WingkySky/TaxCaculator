import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './components/layout/MainLayout';
import { PageType } from './components/layout/Sidebar';
import ForwardPage from './pages/ForwardPage';
import ReversePage from './pages/ReversePage';
import ComparePage from './pages/ComparePage';
import AnnualPage from './pages/AnnualPage';
import BatchPage from './pages/BatchPage';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('forward');

  const renderPage = () => {
    switch (currentPage) {
      case 'forward':
        return <ForwardPage />;
      case 'reverse':
        return <ReversePage />;
      case 'compare':
        return <ComparePage />;
      case 'annual':
        return <AnnualPage />;
      case 'batch':
        return <BatchPage />;
      default:
        return <ForwardPage />;
    }
  };

  return (
    <ThemeProvider>
      <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;