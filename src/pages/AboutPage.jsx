import { useEffect, useState } from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

export default function AboutPage() {
  const [appInfo, setAppInfo] = useState(null);
  const [message, setMessage] = useState('Loading runtime information…');

  useEffect(() => {
    if (!window.api?.getAppInfo) {
      setMessage('You are viewing the browser preview. Open the desktop app to see Electron, Node and Chrome versions.');
      return;
    }
    let active = true;
    async function loadAppInfo() {
      try {
        const info = await window.api.getAppInfo();
        if (active) setAppInfo(info);
      } catch {
        if (active) setMessage('Runtime information could not be loaded. Please restart the desktop app.');
      }
    }
    loadAppInfo();
    // Ignore responses after navigating away, including StrictMode cleanup.
    return () => { active = false; };
  }, []);

  return (
    <div className="page-stack about-page">
      <section className="card about-intro" aria-labelledby="about-title">
        <div className="icon-tile"><ShieldCheck size={26} aria-hidden="true" /></div>
        <p className="eyebrow">ASSESS. DETECT. IMPROVE.</p>
        <h2 id="about-title">RansomReady</h2>
        <p>A Ransomware Readiness Assessment tool developed as a college project for <strong>NTRO problem statement 317</strong>. Ransomware can interrupt operations and access to critical data; RansomReady aims to help organisations understand their preparedness, identify gaps and prioritise improvements.</p>
      </section>
      <div className="about-grid">
        <section className="card detail-card" aria-labelledby="stack-title">
          <h2 id="stack-title">Tech stack</h2>
          <ul className="stack-list">
            <li><strong>React + JavaScript</strong><span>Renderer and UI components</span></li>
            <li><strong>Electron</strong><span>Secure desktop shell</span></li>
            <li><strong>Vite</strong><span>Development and builds</span></li>
            <li><strong>Plain CSS + Lucide</strong><span>Themes, layout and icons</span></li>
          </ul>
        </section>
        <section className="card detail-card" aria-labelledby="runtime-title">
          <h2 id="runtime-title"><Cpu size={20} aria-hidden="true" />Runtime information</h2>
          <div aria-live="polite">
            {appInfo ? (
              <>
                <p className="runtime-app">{appInfo.name} · v{appInfo.version}</p>
                <dl className="versions">
                  <div><dt>Electron</dt><dd>{appInfo.versions.electron}</dd></div>
                  <div><dt>Node</dt><dd>{appInfo.versions.node}</dd></div>
                  <div><dt>Chrome</dt><dd>{appInfo.versions.chrome}</dd></div>
                </dl>
              </>
            ) : <p className="runtime-message">{message}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
