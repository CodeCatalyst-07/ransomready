import { ShieldCheck } from 'lucide-react';
import { navigation } from '../config/navigation.js';

export default function Sidebar({ currentPage, navigate }) {
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
        <span>RansomReady</span><span>v0.1.0</span>
      </div>
    </aside>
  );
}
