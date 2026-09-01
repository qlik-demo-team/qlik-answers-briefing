import { APP_ID } from './authConfig.js';

// Cache the generated briefing in localStorage so returning to it is instant. Keyed by app id so a
// briefing from one app never shows for another.
const KEY = `qab:briefing:${APP_ID}`;

export function loadBriefing() {
  try {
    const cached = JSON.parse(localStorage.getItem(KEY));
    if (!cached || !cached.results) return null;
    // Ignore a run that errored, so a transient failure does not get stuck as a saved answer.
    if (Object.values(cached.results).some((r) => r && r.error)) return null;
    return cached;
  } catch {
    return null;
  }
}

export function saveBriefing(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // too big for localStorage; skip caching
  }
}

// Drop the cached briefing (for example after the prompts change, which makes it stale).
export function clearBriefing() {
  localStorage.removeItem(KEY);
}
