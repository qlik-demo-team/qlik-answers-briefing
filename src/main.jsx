import React from 'react';
import { createRoot } from 'react-dom/client';
import { setDefaultHostConfig } from '@qlik/api/auth';
import App from './App.jsx';
import { OAUTH_HOST_CONFIG } from './authConfig.js';
import './styles.css';

// Register the OAuth2 host config once, before anything renders. Both @qlik/api (our REST calls)
// and @qlik/embed-react (the charts) read it, so they run as the same logged-in user.
// See README: How it works.
setDefaultHostConfig(OAUTH_HOST_CONFIG);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
