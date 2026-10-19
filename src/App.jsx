import { useEffect, useState } from 'react';

export default function App() {
  const [appInfo, setAppInfo] = useState(null);
  const [message, setMessage] = useState('Loading app information…');

  useEffect(() => {
    // A regular browser has no Electron preload bridge.
    if (!window.api) {
      setMessage('You are viewing the browser preview. Run the desktop app to see runtime versions.');
      return;
    }

    // Ignore a late response if this component has already unmounted.
    let active = true;
    async function loadAppInfo() {
      try {
        const info = await window.api.getAppInfo();
        if (active) setAppInfo(info);
      } catch {
        if (active) setMessage('App information could not be loaded. Please restart the desktop app.');
      }
    }
    loadAppInfo();
    return () => { active = false; };
  }, []);

  return (
    <main className="app">
      <header>
        <p className="eyebrow">RANSOMWARE READINESS</p>
        <h1>RansomReady</h1>
        <p className="tagline">Assess. Detect. Improve.</p>
      </header>

      <section className="info-card" aria-labelledby="info-title">
        <p className="phase">Phase 1 · Project setup</p>
        <h2 id="info-title">Desktop app foundation</h2>
        <p className="description">A starting point for understanding your organisation’s ransomware readiness.</p>
        <div aria-live="polite">
          {appInfo ? (
            <>
              <p className="app-version">{appInfo.name} · v{appInfo.version}</p>
              <dl className="versions">
                <div><dt>Electron</dt><dd>{appInfo.versions.electron}</dd></div>
                <div><dt>Node</dt><dd>{appInfo.versions.node}</dd></div>
                <div><dt>Chrome</dt><dd>{appInfo.versions.chrome}</dd></div>
              </dl>
            </>
          ) : <p className="message">{message}</p>}
        </div>
      </section>
      <footer>College project · NTRO problem statement 317</footer>
    </main>
  );
}
