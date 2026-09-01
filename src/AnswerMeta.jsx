import { useState } from 'react';
import Modal from './Modal.jsx';
import RawContent from './RawJson.jsx';
import ReasoningContent, { hasReasoning } from './Reasoning.jsx';
import { extractSources } from './answerData.js';
import Icon from './Icon.jsx';

// The footer under each answer: a row of links (data behind the numbers, reasoning, raw response).
// Each opens a modal, so the detail stays out of the way until asked for.

// "Behind the numbers": the app data behind each claim (the inline citations do the chart jumps).
function SourcesContent({ sources }) {
  return (
    <ol className="sources__list">
      {sources.map((s) => (
        <li className="sources__item" key={s.n}>
          <span className="sources__n">{s.n}</span>
          <div className="sources__text">
            {s.url ? (
              <a className="sources__src" href={s.url} target="_blank" rel="noreferrer">{s.label || 'Source'}</a>
            ) : (
              <span className="sources__src" title={s.expr || undefined}>{s.label || 'Qlik data model'}</span>
            )}
            {s.reason && <span className="sources__reason">{s.reason}</span>}
            {!s.label && s.expr && <code className="sources__expr">{s.expr}</code>}
          </div>
        </li>
      ))}
    </ol>
  );
}

const PANELS = {
  sources: {
    label: 'Behind the numbers',
    icon: 'bar-chart',
    title: 'Behind the numbers',
    intro: 'The app data behind each numbered claim in this answer.',
  },
  reasoning: {
    label: 'How it reasoned',
    icon: 'assistant',
    title: 'How the assistant reasoned',
    intro: 'The steps Qlik Answers took to reach this answer.',
  },
  raw: {
    label: 'Raw response',
    icon: 'code',
    title: 'Raw API response',
    intro: null,
  },
};

export default function AnswerMeta({ raw }) {
  const [open, setOpen] = useState(null);
  const sources = extractSources(raw);

  // Only offer what this answer has; raw is always available.
  const keys = [sources.length ? 'sources' : null, hasReasoning(raw) ? 'reasoning' : null, 'raw'].filter(Boolean);

  return (
    <div className="answer-meta">
      {keys.map((key) => (
        <button key={key} type="button" className="answer-meta__link" onClick={() => setOpen(key)}>
          <Icon name={PANELS[key].icon} size={14} />
          {PANELS[key].label}
        </button>
      ))}

      {open && (
        <Modal title={PANELS[open].title} intro={PANELS[open].intro} onClose={() => setOpen(null)}>
          {open === 'sources' && <SourcesContent sources={sources} />}
          {open === 'reasoning' && <ReasoningContent raw={raw} />}
          {open === 'raw' && <RawContent data={raw} />}
        </Modal>
      )}
    </div>
  );
}
