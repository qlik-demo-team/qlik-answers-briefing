import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Base path the app is served from. Defaults to the site root. Set VITE_BASE if you deploy the build
// into a subfolder. See README: Build and deploy.
const BASE = process.env.VITE_BASE || '/';

// Dev runs on https://localhost:3000 with a self-signed certificate. Your browser warns once; accept
// it to continue. HTTPS is required because the OAuth redirect uses it. See README: Install and run.
export default defineConfig({
  base: BASE,
  plugins: [react(), basicSsl()],
  server: { port: 3000, strictPort: true, https: true },
});
