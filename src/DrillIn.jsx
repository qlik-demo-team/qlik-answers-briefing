import { useState } from 'react';
import { followUp } from './qlik.js';
import { APP_ID } from './authConfig.js';
import AnswerView from './AnswerView.jsx';
import AnswerMeta from './AnswerMeta.jsx';
import Thinking from './Thinking.jsx';
import Icon from './Icon.jsx';

// Suggested next questions from the API (content[].card.followUpActions), deduped by text.
function extractFollowUps(raw) {
  const seen = new Set();
  const out = [];
  (raw?.content || []).forEach((c) =>
    (c?.card?.followUpActions || []).forEach((a) => {
      const text = (a?.text || '').trim();
      if ((a?.type ? a.type === 'question' : true) && text && !seen.has(text)) {
        seen.add(text);
        out.push(text);
      }
    }),
  );
  return out;
}

// The follow-up zone under each answer: an always-visible input plus the API's suggested-question
// chips, asking on the same thread so the assistant keeps context. Replies render like the briefing.
export default function DrillIn({ raw, threadId, mode }) {
  const [messages, setMessages] = useState([]); // { role:'user', text } | { role:'assistant', raw|error }
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [tid, setTid] = useState(threadId);

  // Chips come from the most recent answer: the briefing to start, then each reply.
  const lastReply = [...messages].reverse().find((m) => m.role === 'assistant' && m.raw);
  const suggestions = extractFollowUps(lastReply ? lastReply.raw : raw);

  async function ask(question) {
    const q = (question || '').trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setText('');
    setBusy(true);
    try {
      const { threadId: usedTid, raw: replyRaw } = await followUp(tid, q, mode);
      setTid(usedTid); // remember the thread in case we opened a fresh one
      setMessages((m) => [...m, { role: 'assistant', raw: replyRaw }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', error: String(err.message || err) }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="followup">
      <div className="followup__eyebrow">
        <Icon name="assistant" size={16} /> Keep exploring
      </div>

      {messages.length > 0 && (
        <div className="followup__thread">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div className="followup__q" key={i}>{m.text}</div>
            ) : (
              <div className="followup__a" key={i}>
                {m.error ? (
                  <p className="error">{m.error}</p>
                ) : (
                  <>
                    <AnswerView raw={m.raw} appId={APP_ID} />
                    <AnswerMeta raw={m.raw} />
                  </>
                )}
              </div>
            ),
          )}
        </div>
      )}

      {busy && <div className="followup__a"><Thinking mode={mode} /></div>}

      {!busy && suggestions.length > 0 && (
        <div className="followup__suggest">
          {suggestions.map((s, i) => (
            <button type="button" className="followup-chip" key={i} onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form className="followup__form" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <input
          className="input followup__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask a follow-up about this briefing…"
          aria-label="Ask a follow-up"
        />
        <button className="btn btn--primary" type="submit" disabled={busy || !text.trim()}>Ask</button>
      </form>
    </div>
  );
}
