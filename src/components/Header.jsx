import ThemeToggle from './ThemeToggle.jsx';

export default function Header({ title, theme, toggleTheme }) {
  return (
    <header className="page-header">
      <h1 id="page-title">{title}</h1>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </header>
  );
}
