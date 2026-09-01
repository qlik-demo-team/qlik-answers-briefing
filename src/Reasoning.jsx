import { clean, renderRich } from './answerText.jsx';

// The assistant's reasoning trace lives at content[].card.reasoning: the multi-agent steps Qlik
// Answers shows while thinking. Rendered on demand in the answer's details modal.

function reasoningCards(raw) {
  return (raw?.content || [])
    .map((c) => c?.card?.reasoning)
    .filter((r) => r && Array.isArray(r.body) && r.body.length);
}

// Is there any reasoning to show? Drives whether the footer offers the "How it reasoned" control.
export function hasReasoning(raw) {
  return reasoningCards(raw).length > 0;
}

// An agent label ("Answers Agent", "Data Analyst Agent") becomes a section heading.
function isAgentHeading(text) {
  return /agent$/i.test(text) && text.length < 40;
}

// Connector lines the API adds to introduce the trace; noise once we render it ourselves.
const BOILERPLATE = [
  /^to see how the assistant got to this answer/i,
  /^the assistant worked on the \d+ following steps?/i,
];

// Walk the reasoning card (nested Container/ColumnSet/Column) for its TextBlocks in order. Keep line
// breaks (clean() collapses newlines, so split first); agent labels become headings.
function collectSteps(cards) {
  const steps = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    if (node.type === 'TextBlock' && typeof node.text === 'string') {
      const whole = clean(node.text);
      if (!whole || BOILERPLATE.some((re) => re.test(whole))) return;
      if (isAgentHeading(whole)) {
        steps.push({ heading: true, text: whole });
      } else {
        const lines = node.text.split(/\r?\n|\\r?\\n/).map(clean).filter(Boolean);
        if (lines.length) steps.push({ heading: false, lines });
      }
    }
    for (const k of Object.keys(node)) {
      if (node[k] && typeof node[k] === 'object') walk(node[k]);
    }
  };
  cards.forEach((c) => walk(c.body));
  // Drop the orchestrator preamble before the first agent; the API repeats it inside that section.
  const firstAgent = steps.findIndex((s) => s.heading);
  return firstAgent > 0 ? steps.slice(firstAgent) : steps;
}

// The reasoning trace as ordered steps, rendered inside <Modal> by AnswerMeta.
export default function ReasoningContent({ raw }) {
  const steps = collectSteps(reasoningCards(raw));
  if (!steps.length) return <p className="muted">No reasoning detail was included in this response.</p>;
  return (
    <div className="reasoning__body">
      {steps.map((s, i) =>
        s.heading ? (
          <h3 className="reasoning__agent" key={i}>{s.text}</h3>
        ) : (
          <div className="reasoning__step" key={i}>
            {s.lines.map((line, j) => (
              <p key={j}>{renderRich(line)}</p>
            ))}
          </div>
        ),
      )}
    </div>
  );
}
