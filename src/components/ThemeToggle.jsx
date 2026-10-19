import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ theme, toggleTheme }) {
  const Icon = theme === 'dark' ? Sun : Moon;
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme}
      aria-label={label} title={label}>
      <Icon size={19} aria-hidden="true" />
    </button>
  );
}
