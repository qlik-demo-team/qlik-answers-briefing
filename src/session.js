// Tiny pub/sub for one event: the Qlik session died. Callers report it; SessionExpiredModal listens.
// Fires once; later reports are ignored.
let expired = false;
const listeners = new Set();

export function reportSessionExpired() {
  if (expired) return;
  expired = true;
  listeners.forEach((cb) => cb());
}

export function onSessionExpired(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
