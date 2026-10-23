import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { navigation } from '../config/navigation.js';

export default function Sidebar({ currentPage, navigate }) {
  const [version, setVersion] = useState('');

  useEffect(() => {
    let active = true;
    async function loadVersion() {
      try {
        const info = await window.api?.getAppInfo?.();
        if (active && typeof info?.version === 'string') setVersion(info.version);
      } catch { /* An unavailable version is simply hidden. */ }
    }
    loadVersion();
    return () => { active = false; };
  }, []);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-name"><ShieldCheck size={27} aria-hidden="true" />RansomReady</div>
        <p>Assess. Detect. Improve.</p>
      </div>
      <p className="nav-caption">WORKSPACE</p>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className="nav-item"
            aria-current={currentPage === id ? 'page' : undefined}
            onClick={() => navigate(id)}>
            <Icon size={20} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span>RansomReady</span>{version && <span>v{version}</span>}
      </div>
    </aside>
  );
}
