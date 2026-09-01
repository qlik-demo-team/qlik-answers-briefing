# Qlik Answers Briefing Starter

A small React app that turns a list of predefined questions into a briefing. Each question is sent to
Qlik Answers and answered from your Qlik app, with live charts, follow-up questions, and a view of the
data and reasoning behind each answer. Users sign in to your Qlik Cloud tenant with OAuth2 interactive login.

Built with React and Vite. It uses `@qlik/api` for authentication and the assistant calls, and
`@qlik/embed-react` to draw charts.

## What you need

1. A Qlik Cloud tenant.
2. A Qlik Sense app in that tenant with data.
3. Qlik Answers set up for that app.
4. Node.js 18 or later.

## Step 1: Create an OAuth client

The app signs in with a Single-page-app OAuth client. It is a public client with no secret.

1. In Qlik Cloud, open the management console and go to Settings, then OAuth.
2. Select Create new, and choose Single-page app as the client type.
3. Give it a name.
4. Under Redirect URLs, add your app origin with a trailing slash. For local development this is
   `https://localhost:3000/`.
5. Under Allowed origins, add the same origin without the trailing slash, for example
   `https://localhost:3000`.
6. Create the client and copy the Client ID. No client secret is issued, which is expected.

If you deploy the app later, add the deployed URL as another redirect URL and allowed origin.

## Step 2: Configure

Copy the example environment file and fill in your values:

```
cp .env.example .env
```

Set these in `.env`:

- `VITE_QLIK_HOST`: your tenant URL, for example `https://your-tenant.us.qlikcloud.com`
- `VITE_APP_ID`: the Qlik Sense app id
- `VITE_OAUTH_CLIENT_ID`: the Client ID from Step 1

## Step 3: Install and run

```
npm install
npm run dev
```

Open `https://localhost:3000`. The dev server uses a self-signed certificate, so your browser will
warn you once. Accept it to continue. HTTPS is required because the OAuth redirect uses it.

Click Sign in with Qlik. You are sent to your tenant to log in, then returned to the briefing. If you
already have a tenant session, this is silent.

## How it works

- Authentication is OAuth2 SPA. `main.jsx` registers one host config that both `@qlik/api` and
  `@qlik/embed-react` read, so REST calls and charts run as the same user. `App.jsx` gates the app on
  sign-in.
- The briefing calls the Qlik Answers cloud-assistants API (`src/qlik.js`). For each prompt it creates
  a thread and asks the question. Follow-ups reuse that thread so the assistant keeps context.
- Answers come back as Adaptive Cards. `AnswerView.jsx` turns them into text, KPIs, and charts.
  `QlikEmbedChart.jsx` draws each chart on the fly from its measures and dimensions.
- The result is cached in the browser (`src/cache.js`) so returning to the briefing is instant.
  Refresh fetches new answers.
- The Fast and Thinking toggle in the hero sets how much reasoning the assistant does. Fast returns a
  shorter answer sooner, Thinking runs the full multi-agent reasoning. Switching re-runs the briefing
  and the choice is remembered.

## Editing the briefing

There are two ways to change the questions the briefing asks:

- In the app: select Edit prompts in the top bar. Add, edit, remove, or reset the prompts, then save.
  Your list is stored in the browser and takes precedence over the defaults. Saving re-runs the
  briefing.
- In code: edit the list in `src/prompts.js`. These are the defaults and what Reset to defaults
  restores. Each entry needs a unique `id` and the `text` of the question.

## Build and deploy

```
npm run build
```

The output is in `dist/`. Serve it as a static site. Two things to check:

- If you serve the app from a subfolder rather than the domain root, set `VITE_BASE` to that path at
  build time.
- The redirect URL and allowed origin registered on the OAuth client must match the deployed origin
  and base exactly. Add them alongside the localhost entries.

## Project structure

```
src/
  main.jsx              App entry; registers the OAuth host config
  App.jsx               Sign-in gate and top-level layout
  authConfig.js         Reads env values; builds the OAuth host config
  qlik.js               Token handling and the Qlik Answers calls
  prompts.js            Default questions plus the saved-prompts store (edit this)
  cache.js              Caches the briefing in localStorage
  session.js            Small pub/sub for session-expired events
  pages/BriefingPage.jsx  The briefing: hero, cards, refresh
  pages/SetupPage.jsx   Edit the prompts that drive the briefing
  AnswerView.jsx        Renders an answer (text, KPIs, charts)
  QlikEmbedChart.jsx    Draws a chart from measures and dimensions
  DrillIn.jsx           Follow-up questions and suggestion chips
  AnswerMeta.jsx        The "behind the numbers / reasoning / raw" footer
  Modal.jsx             Accessible modal used by AnswerMeta
  Reasoning.jsx         Renders the assistant's reasoning trace
  RawJson.jsx           Renders the raw API response
  answerText.jsx        Text cleanup and citation rendering
  answerData.js         Parses citations out of the response
  snapshot.js           Turns a snapshot into a chart definition
  SessionExpiredModal.jsx  Prompts a refresh when the session ends
  Thinking.jsx          Progress indicator while answers load
  Icon.jsx              Inline SVG icons
  styles.css            All styling
```

## License

MIT. See [LICENSE](LICENSE).
