import { useState, useEffect } from 'react';
import { connect, logout, hasFreshToken, interactiveTokenStale, clearInteractiveToken } from './qlik.js';
import { CONFIGURED } from './authConfig.js';
import { PROMPTS, loadPrompts, savePrompts } from './prompts.js';
import { clearBriefing } from './cache.js';
import BriefingPage from './pages/BriefingPage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import SessionExpiredModal from './SessionExpiredModal.jsx';
import Icon from './Icon.jsx';

// Our own flag, saved before the login redirect so we know on the way back that we are mid sign-in.
const SIGNING_IN = 'qab:signing-in';

export default function App() {
  // 'signin' waits for the user to click; 'connecting' is establishing the session; 'ready' shows it.
  const [status, setStatus] = useState(() => {
    if (hasFreshToken()) return 'ready';
    if (sessionStorage.getItem(SIGNING_IN)) return 'connecting';
    return 'signin';
  });

  // 'briefing' shows the answers; 'setup' edits the prompts that drive them.
  const [view, setView] = useState('briefing');
  const [prompts, setPrompts] = useState(loadPrompts);
  // Bumping this remounts the briefing so it re-runs after the prompts change.
  const [briefingKey, setBriefingKey] = useState(0);

  function onSavePrompts(list) {
    savePrompts(list);
    setPrompts(list);
    clearBriefing(); // the cached answers are for the old prompts
    setBriefingKey((k) => k + 1);
    setView('briefing');
  }

  // On mount, when we already have a token or are returning from login, confirm the session. Drop a
  // stale token first (@qlik/api reuses expired ones), then connect() confirms it or exchanges the code.
  useEffect(() => {
    if (status === 'signin') return;
    if (interactiveTokenStale()) clearInteractiveToken();
    let alive = true;
    connect()
      .then(() => { sessionStorage.removeItem(SIGNING_IN); if (alive) setStatus('ready'); })
      .catch(() => { sessionStorage.removeItem(SIGNING_IN); if (alive) setStatus('signin'); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On returning to a long-idle tab the token may have expired under the charts. Catch it when the tab
  // becomes visible and sign in again silently by clearing the token and reloading.
  // See README: Notes and limitations.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && status === 'ready' && interactiveTokenStale()) {
        clearInteractiveToken();
        window.location.reload();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [status]);

  async function signIn() {
    sessionStorage.setItem(SIGNING_IN, '1');
    setStatus('connecting');
    try {
      await connect();
      sessionStorage.removeItem(SIGNING_IN);
      setStatus('ready');
    } catch {
      // connect() redirects to Qlik when there is no session; nothing to do here.
    }
  }

  function signOut() {
    sessionStorage.removeItem(SIGNING_IN);
    clearInteractiveToken();
    logout();
    setStatus('signin');
  }

  if (status === 'connecting') {
    return <Splash title="Signing you in…" sub="Taking you to Qlik, then back to your briefing." />;
  }

  if (status === 'signin') {
    return <SignIn configured={CONFIGURED} onSignIn={signIn} />;
  }

  return (
    <>
      <div className="app">
        <header className="topbar">
          <Wordmark />
          <div className="topbar__actions">
            {view === 'briefing' && (
              <button className="btn btn--quiet btn--small" onClick={() => setView('setup')}>
                <Icon name="settings" size={16} /> Edit prompts
              </button>
            )}
            <button className="btn btn--quiet btn--small" onClick={signOut}>Sign out</button>
          </div>
        </header>
        <main className="app__main">
          {view === 'setup' ? (
            <SetupPage
              prompts={prompts}
              defaults={PROMPTS}
              onSave={onSavePrompts}
              onCancel={() => setView('briefing')}
            />
          ) : (
            <BriefingPage key={briefingKey} prompts={prompts} />
          )}
        </main>
      </div>
      <SessionExpiredModal />
    </>
  );
}

function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wordmark__mark" aria-hidden="true" />
      Qlik Answers Briefing
    </span>
  );
}

function SignIn({ configured, onSignIn }) {
  return (
    <div className="signin">
      <div className="signin__card">
        <div className="signin__badge"><Icon name="assistant" size={24} /></div>
        <h1 className="signin__title">Qlik Answers Briefing</h1>
        <p className="signin__sub">Sign in to your Qlik Cloud tenant to view the briefing.</p>
        {configured ? (
          <button className="btn btn--primary btn--block" onClick={onSignIn}>Sign in with Qlik</button>
        ) : (
          <p className="error">
            Missing config. Set VITE_QLIK_HOST, VITE_APP_ID and VITE_OAUTH_CLIENT_ID in .env (see .env.example).
          </p>
        )}
      </div>
    </div>
  );
}

function Splash({ title, sub }) {
  return (
    <div className="signin">
      <div className="signin__card">
        <div className="signin__badge"><Icon name="assistant" size={24} /></div>
        <h1 className="signin__title">{title}</h1>
        <p className="signin__sub">{sub}</p>
      </div>
    </div>
  );
}
