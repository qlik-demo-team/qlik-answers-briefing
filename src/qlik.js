// OAuth token handling and the Qlik Answers API calls. For the big picture, see README: How it works.
import { logout as apiLogout } from '@qlik/api/auth';
import { reportSessionExpired } from './session.js';
import { QLIK_HOST, APP_ID, OAUTH_HOST_CONFIG, OAUTH_CLIENT_ID } from './authConfig.js';

// --- Auth --------------------------------------------------------------------

// @qlik/api loads its auth code from the tenant on demand (kicked off by setDefaultHostConfig in
// main.jsx). Wait for it here so a call made right after the login redirect does not run too early.
async function getAuthRuntime() {
  let loaderPromise = window.__qlikMainPrivateResolvers?.qlikMainPromise;
  for (let i = 0; !loaderPromise && i < 200; i++) {
    await new Promise((resolve) => setTimeout(resolve, 25)); // up to ~5s
    loaderPromise = window.__qlikMainPrivateResolvers?.qlikMainPromise;
  }
  const qlikMain = await (loaderPromise ?? Promise.resolve(window.QlikMain));
  if (!qlikMain?.import) throw new Error('Qlik auth runtime unavailable. Is the tenant reachable?');
  return qlikMain.import('auth@v1');
}

// Bearer token for the logged-in OAuth2 session. We use getRestCallAuthParams, not getAccessToken:
// the latter is a backend helper and is not implemented in the browser auth runtime.
async function getToken() {
  const authRuntime = await getAuthRuntime();
  const { headers } = await authRuntime.getRestCallAuthParams({ hostConfig: OAUTH_HOST_CONFIG, method: 'POST' });
  const token = (headers?.Authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Login did not yield an access token');
  return token;
}

// Establish (or confirm) the session. The first call redirects to the tenant login if there is no
// session yet; after that it resolves at once.
export async function connect() {
  await getToken();
  return true;
}

// Sign out of the tenant.
export function logout() {
  apiLogout?.();
}

// @qlik/api caches the OAuth token in session storage and reuses it without checking expiry, so a
// long-idle tab can hand the charts an expired token. These helpers read that cache so the app can
// tell whether a fresh session exists and refresh a stale one first. Key: qlik-qmfe-api-<clientId>...
const TOKEN_PREFIX = OAUTH_CLIENT_ID ? `qlik-qmfe-api-${OAUTH_CLIENT_ID}` : '';

function tokenKeys() {
  if (!TOKEN_PREFIX || typeof window === 'undefined') return [];
  return Object.keys(sessionStorage).filter((k) => k.startsWith(TOKEN_PREFIX) && k.endsWith('-access-token'));
}

function jwtExpMs(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/** True if a usable (unexpired) token is already stored for this tab. */
export function hasFreshToken() {
  return tokenKeys().some((k) => jwtExpMs(sessionStorage.getItem(k) || '') > Date.now());
}

/** True if the stored token is expired or within bufferMs of expiring. */
export function interactiveTokenStale(bufferMs = 120000) {
  const keys = tokenKeys();
  if (!keys.length) return false;
  return keys.some((k) => {
    const exp = jwtExpMs(sessionStorage.getItem(k) || '');
    return exp > 0 && exp <= Date.now() + bufferMs;
  });
}

/** Drop the cached tokens so the next call re-acquires a fresh one via a silent redirect. */
export function clearInteractiveToken() {
  tokenKeys().forEach((k) => {
    sessionStorage.removeItem(k);
    sessionStorage.removeItem(k.replace(/-access-token$/, '-refresh-token'));
  });
}

// --- Assistant calls ---------------------------------------------------------

// reasoningMode: 'fast' (~15-20s, short trace) or 'think' (~45-55s, full reasoning); same answer.
// reasoning_mode isn't in Qlik's public docs yet, so treat it as experimental.
function appContext(reasoningMode) {
  const data = { mode: 'live', route: 'answers', custom: true };
  if (reasoningMode) data.reasoning_mode = reasoningMode;
  return { type: 'app', id: APP_ID, data };
}

async function post(path, body) {
  const token = await getToken();
  const res = await fetch(`${QLIK_HOST}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 401) reportSessionExpired();
    const err = new Error(`${path} failed (${res.status}): ${await res.text().catch(() => '')}`);
    err.status = res.status; // lets callers tell "thread gone" apart from "session expired"
    throw err;
  }
  return res.json();
}

/** Create a thread (once per question). */
export async function createThread(name = 'Briefing thread', reasoningMode) {
  const data = await post('/api/v1/cloud-assistants/threads', {
    name,
    context: appContext(reasoningMode),
    messages: [],
  });
  return data.id;
}

/** Ask a question on a thread. */
export async function invoke(threadId, promptText, reasoningMode) {
  return post(`/api/v1/cloud-assistants/${threadId}/actions/invoke`, {
    context: appContext(reasoningMode),
    content: [{ text: promptText }],
  });
}

/** One prompt end to end. Returns the thread id plus { text, raw }. */
export async function ask(promptText, reasoningMode) {
  const threadId = await createThread(promptText.slice(0, 40), reasoningMode);
  const raw = await invoke(threadId, promptText, reasoningMode);
  return { threadId, text: extractText(raw), raw };
}

// Follow up on an existing thread so the assistant keeps context. If the thread cannot be reused,
// open a fresh one. Returns the thread actually used plus the reply.
export async function followUp(threadId, promptText, reasoningMode) {
  try {
    const raw = await invoke(threadId, promptText, reasoningMode);
    return { threadId, raw };
  } catch (err) {
    if (err?.status === 401) throw err; // a session problem, not a stale thread; let it surface
    const freshId = await createThread(promptText.slice(0, 40), reasoningMode);
    const raw = await invoke(freshId, promptText, reasoningMode);
    return { threadId: freshId, raw };
  }
}

function extractText(raw) {
  return (
    raw?.content?.map?.((c) => c.text).filter(Boolean).join('\n\n') ||
    raw?.message?.content ||
    raw?.answer ||
    raw?.output ||
    ''
  );
}
