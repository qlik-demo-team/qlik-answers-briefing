import { memo, useId, useMemo } from 'react';
import QlikEmbedChart from './QlikEmbedChart.jsx';
import { snapshotToDefinition } from './snapshot.js';
import { clean, renderRich } from './answerText.jsx';
import { cards, extractSources } from './answerData.js';

// Renders the assistant's Adaptive Card: text blocks as paragraphs (with bold + citation chips),
// each Qlik.Snapshot as a live qlik-embed chart. Sources / reasoning / raw live in AnswerMeta.

const isWide = (type) => /table/i.test(type || ''); // tables span full width; other charts read at half
const caption = (v) => (v.labels || []).filter(Boolean).join(', '); // chart heading from measure labels

function AnswerView({ raw, appId }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ''); // id-safe prefix for chart anchors

  // Derive drawables once and keep them stable; fresh dimension/measure arrays each render would
  // make QlikEmbedChart reload the chart (flicker).
  const { hasBody, texts, kpis, charts, byN } = useMemo(() => {
    const body = cards(raw).flatMap((c) => c.body || []);

    // Text blocks + drawable charts, in order. vid is the card-body index a citation points at.
    const texts = [];
    const visuals = [];
    body.forEach((b, idx) => {
      const type = b.type || '';
      if (type === 'TextBlock') {
        if (b.isVisible === false) return; // hidden debug blocks
        const text = clean(b.text);
        if (!text) return;
        const isHeading = b.weight === 'bolder' && b.size === 'medium';
        if (isHeading && /^conclusions?$/i.test(text)) return; // drop the generic "Conclusion" label
        texts.push({ text, isHeading });
      } else if (type.includes('Snapshot') && b.snapshot) {
        const def = snapshotToDefinition(b.snapshot);
        if (def.measures.length) visuals.push({ ...def, vid: idx });
      }
    });

    const lead = texts.find((t) => !t.isHeading); // first paragraph is the takeaway
    if (lead) lead.isLead = true;

    const kpis = visuals.filter((v) => v.type === 'kpi');
    const charts = visuals.filter((v) => v.type !== 'kpi');
    const sources = extractSources(raw);
    const byN = Object.fromEntries(sources.map((s) => [String(s.n), s]));
    return { hasBody: body.length > 0, texts, kpis, charts, byN };
  }, [raw]);

  if (!hasBody) {
    return <p className="muted">No formatted content, see the raw response.</p>;
  }

  const anchorId = (vid) => `src-${uid}-${vid}`;
  // Scroll to a cited chart and flash it.
  const jumpToChart = (vid) => {
    const el = document.getElementById(anchorId(vid));
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('chart-flash');
    setTimeout(() => el.classList.remove('chart-flash'), 1400);
  };

  return (
    <div className="answer">
      {texts.map((t, i) =>
        t.isHeading ? (
          <h4 className="answer__heading" key={i}>{t.text}</h4>
        ) : (
          <p className={t.isLead ? 'answer__lead' : 'answer__text'} key={i}>{renderRich(t.text, byN, jumpToChart)}</p>
        ),
      )}

      {kpis.length > 0 && (
        <div className="answer__kpis">
          {kpis.map((v, i) => (
            <div className="kpi-cell" id={anchorId(v.vid)} key={`k${i}`}>
              <QlikEmbedChart appId={appId} type={v.type} dimensions={v.dimensions} measures={v.measures} label={caption(v)} height={140} />
            </div>
          ))}
        </div>
      )}

      {charts.length > 0 && (
        <div className="answer__charts">
          {charts.map((v, i) => {
            const full = charts.length === 1 || isWide(v.type); // lone chart or table spans full width
            return (
              <div className={`chart-cell${full ? ' chart-cell--full' : ''}`} id={anchorId(v.vid)} key={`c${i}`}>
                <QlikEmbedChart appId={appId} type={v.type} dimensions={v.dimensions} measures={v.measures} label={caption(v)} height={isWide(v.type) ? 320 : 280} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Memoized so typing in a follow-up input does not re-render this answer and reload its charts.
export default memo(AnswerView);
