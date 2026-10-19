import { useState } from 'react';
import { navigation } from './config/navigation.js';
import { useTheme } from './hooks/useTheme.js';
import Layout from './components/Layout.jsx';
import './styles/layout.css';
import './styles/components.css';

// The same config registers sidebar labels and page components.
const pages = Object.fromEntries(navigation.map((item) => [item.id, item.component]));

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const { theme, toggleTheme } = useTheme();
  const Page = pages[currentPage];
  const activeItem = navigation.find((item) => item.id === currentPage);

  function navigate(pageId) {
    if (pages[pageId]) setCurrentPage(pageId);
  }

  return (
    <Layout currentPage={currentPage} title={activeItem.label}
      navigate={navigate} theme={theme} toggleTheme={toggleTheme}>
      <Page navigate={navigate} />
    </Layout>
  );
}
