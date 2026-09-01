import { useEffect, useState } from 'react';
import { ask } from '../qlik.js';
import { APP_ID } from '../authConfig.js';
import { loadBriefing, saveBriefing } from '../cache.js';
import AnswerView from '../AnswerView.jsx';
import AnswerMeta from '../AnswerMeta.jsx';
import DrillIn from '../DrillIn.jsx';
import Thinking from '../Thinking.jsx';
import Icon from '../Icon.jsx';

const REASONING_KEY = 'qab:reasoning';

const formatTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// Human "how fresh" cue for a cached briefing (exact time on hover).
function freshness(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const todayLong = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// Placeholder card while an answer is loading.
function SkeletonCard() {
  return (
    <div className="card skeleton">
      <div className="sk sk--title" />
      <div className="sk sk--line" />
      <div className="sk sk--line" />
      <div className="sk sk--line sk--short" />
      <div className="sk sk--chart" />
    </div>
  );
}

// The briefing: shows the cached answers instantly; Refresh re-fetches. Prompts run in parallel.
export default function BriefingPage({ prompts }) {
  const [results, setResults] = useState({});
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState(() => localStorage.getItem(REASONING_KEY) || 'think');

  // On open: show the cached briefing if we have one, otherwise fetch it.
  useEffect(() => {
    const cached = loadBriefing();
    if (cached) {
      setResults(cached.results);
      setGeneratedAt(cached.generatedAt);
    } else {
      generate(false, mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate(isRefresh, useMode) {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setResults(Object.fromEntries(prompts.map((p) => [p.id, { loading: true }])));

    const next = {};
    await Promise.all(
      prompts.map(async (p) => {
        try {
          const { raw, threadId } = await ask(p.text, useMode);
          next[p.id] = { raw, threadId }; // keep threadId so follow-ups stay on this thread
        } catch (err) {
          next[p.id] = { error: String(err.message || err) };
        }
        setResults((r) => ({ ...r, [p.id]: next[p.id] }));
      }),
    );

    const when = new Date().toISOString();
    setGeneratedAt(when);
    // Only cache a clean run; a cached error would re-appear as a saved answer.
    const anyError = Object.values(next).some((r) => r && r.error);
    if (!anyError) saveBriefing({ results: next, generatedAt: when });
    isRefresh ? setRefreshing(false) : setLoading(false);
  }

  // Switch answer speed and re-run the briefing with it.
  function chooseMode(m) {
    localStorage.setItem(REASONING_KEY, m);
    setMode(m);
    generate(true, m);
  }

  const busy = loading || refreshing;

  return (
    <section className="briefing">
      <header className="hero">
        <div className="hero__top">
          <div className="hero__lead">
            <p className="hero__eyebrow">Answers briefing</p>
            <h2 className="hero__title">Your briefing</h2>
            <p className="hero__sub">{todayLong()}</p>
          </div>
          <div className="hero__controls">
            {generatedAt && !loading && (
              <span className="hero__updated" title={formatTime(generatedAt)}>Updated {freshness(generatedAt)}</span>
            )}
            <div className="seg seg--dark" role="group" aria-label="Answer speed">
              <button aria-pressed={mode === 'fast'} onClick={() => chooseMode('fast')} disabled={busy}>Fast</button>
              <button aria-pressed={mode === 'think'} onClick={() => chooseMode('think')} disabled={busy}>Thinking</button>
            </div>
            <button className="btn btn--dark" onClick={() => generate(true, mode)} disabled={busy}>
              <Icon name="reload" size={16} /> {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        {busy && (
          <div className="hero__progress">
            <Thinking mode={mode} label={refreshing ? 'Refreshing your briefing' : undefined} />
          </div>
        )}
      </header>

      <div className="brief-body">
        {prompts.map((p) => {
          const res = results[p.id];
          if (res?.loading) return <SkeletonCard key={p.id} />;
          return (
            <div className="card" key={p.id}>
              <h3>{p.text}</h3>
              {res?.error && <p className="error">{res.error}</p>}
              {res?.raw && <AnswerView raw={res.raw} appId={APP_ID} />}
              {res?.raw && <DrillIn raw={res.raw} threadId={res.threadId} mode={mode} />}
              {res?.raw && <AnswerMeta raw={res.raw} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
