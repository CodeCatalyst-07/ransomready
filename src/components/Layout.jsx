import { useEffect, useRef } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

export default function Layout({ currentPage, title, navigate, theme, toggleTheme, children }) {
  const contentRef = useRef(null);

  useEffect(() => {
    // Each page starts at the top, even if the previous page was scrolled.
    contentRef.current.scrollTop = 0;
  }, [currentPage]);

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Sidebar currentPage={currentPage} navigate={navigate} />
      <div className="workspace">
        <Header title={title} theme={theme} toggleTheme={toggleTheme} />
        <main className="main-content" id="main-content" ref={contentRef}
          tabIndex={-1} aria-labelledby="page-title">
          <div className="page-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
