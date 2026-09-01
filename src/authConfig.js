// Reads the tenant and OAuth values from your .env file.
// See README: Configure (Step 2), and .env.example for the list of variables.

export const QLIK_HOST = (import.meta.env.VITE_QLIK_HOST || '').replace(/\/+$/, '');
export const APP_ID = import.meta.env.VITE_APP_ID || '';
export const OAUTH_CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID || '';

// True once the required values are present.
export const CONFIGURED = !!(QLIK_HOST && APP_ID && OAUTH_CLIENT_ID);

// Where Qlik sends the user back after login. This must exactly match a redirect URL on your OAuth
// client, for example https://localhost:3000/ in development.
// See README: Create an OAuth client (Step 1).
export const REDIRECT_URI =
  typeof window !== 'undefined' ? `${window.location.origin}${import.meta.env.BASE_URL || '/'}` : '';

// One OAuth2 host config, shared by @qlik/api (REST calls) and @qlik/embed-react (charts), so both
// run as the same logged-in user.
export const OAUTH_HOST_CONFIG = {
  authType: 'oauth2',
  host: QLIK_HOST,
  clientId: OAUTH_CLIENT_ID,
  redirectUri: REDIRECT_URI,
  accessTokenStorage: 'session',
};
