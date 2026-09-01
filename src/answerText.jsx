// Shared text helpers for the assistant's Adaptive Card text (AnswerView + Reasoning).

// Clean up the assistant's markup: turn citation tags into a chip marker, strip the rest, drop emoji.
export function clean(text) {
  return (text || '')
    .replace(/<citation[^>]*>(.*?)<\/citation>/gi, '⟦cite:$1⟧')
    .replace(/<cite[^>]*>(.*?)<\/cite>/gi, '⟦cite:$1⟧')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?statement>/gi, ' ')
    .replace(/<\/?plan>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\r?\\n/g, ' ')
    .replace(/\r?\n/g, ' ')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '') // drop emoji; a briefing reads as plain prose
    .replace(/[️‍⃣]/g, '') // and their variation selector / zero-width joiner / keycap
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Render **bold** and citation chips. byN maps a citation number to its source; with byN + onJump a
// chip jumps to its chart, otherwise it is a plain superscript (the reasoning trace passes neither).
export function renderRich(text, byN, onJump) {
  return text.split(/(\*\*[^*]+\*\*|⟦cite:[^⟧]+⟧)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const cite = part.match(/^⟦cite:([^⟧]+)⟧$/);
    if (cite) {
      const s = byN?.[cite[1]];
      const title = s ? [s.label, s.reason].filter(Boolean).join(' · ') : undefined;
      const clickable = !!(s && s.chartVid != null && onJump);
      return (
        <sup
          className={`cite${clickable ? ' cite--link' : ''}`}
          key={i}
          title={title}
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          onClick={clickable ? () => onJump(s.chartVid) : undefined}
          onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onJump(s.chartVid) : undefined}
        >
          {cite[1]}
        </sup>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
