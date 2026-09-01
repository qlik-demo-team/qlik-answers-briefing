import { useEffect, useState } from 'react';
import { onSessionExpired, reportSessionExpired } from './session.js';
import Icon from './Icon.jsx';

// One modal when the Qlik session dies, instead of "Session has timed out" flickering across every
// chart. We watch three signals: a 401 from the Answers API (reported by qlik.js), a qlik-embed error
// event, and qlik-embed's own "timed out" banner (scanned for below).
const SESSION_TEXT = /session (has )?(timed out|expired)|please refresh/i;
const SESSION_ERROR = /session|timed out|timeout|expired|closed|websocket|unauthor|401|403/i;

// qlik-embed's banner lives in nested shadow roots, which plain textContent cannot reach.
function deepText(node) {
  let text = node.textContent || '';
  const roots = node.shadowRoot ? [node.shadowRoot] : [];
  node.querySelectorAll?.('*').forEach((el) => el.shadowRoot && roots.push(el.shadowRoot));
  roots.forEach((root) => { text += ' ' + deepText(root); });
  return text;
}

export default function SessionExpiredModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => onSessionExpired(() => setOpen(true)), []);

  useEffect(() => {
    if (open) return; // nothing more to watch once it is up

    function onEmbedError(e) {
      const msg = String(e?.detail?.message || e?.detail?.error || e?.detail || '');
      if (SESSION_ERROR.test(msg)) reportSessionExpired();
    }
    document.addEventListener('qlik-embed:error', onEmbedError, true);

    const scan = setInterval(() => {
      for (const el of document.querySelectorAll('qlik-embed-react')) {
        if (SESSION_TEXT.test(deepText(el))) {
          reportSessionExpired();
          break;
        }
      }
    }, 4000);

    return () => {
      document.removeEventListener('qlik-embed:error', onEmbedError, true);
      clearInterval(scan);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="session-title">
      <div className="alert">
        <div className="alert__icon"><Icon name="warning" size={24} /></div>
        <h2 className="alert__title" id="session-title">Your session expired</h2>
        <p className="alert__body">Your Qlik session timed out. Refresh the page to continue.</p>
        <button className="btn btn--green" onClick={() => window.location.reload()}>
          <Icon name="reload" size={16} /> Refresh page
        </button>
      </div>
    </div>
  );
}
