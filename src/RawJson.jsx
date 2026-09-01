// Syntax-highlighted raw JSON for the details modal. Tokens become colored React nodes, not
// innerHTML, so React escapes every value and there is no XSS risk.
const TOKEN = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function classify(m) {
  if (m[0] === '"') return /:$/.test(m) ? 'j-key' : 'j-str';
  if (m === 'true' || m === 'false') return 'j-bool';
  if (m === 'null') return 'j-null';
  return 'j-num';
}

// Alternate plain text (braces, commas) with highlighted token spans.
function tokenize(json) {
  const out = [];
  let last = 0;
  let match;
  let i = 0;
  TOKEN.lastIndex = 0;
  while ((match = TOKEN.exec(json)) !== null) {
    if (match.index > last) out.push(json.slice(last, match.index));
    out.push(<span key={i++} className={classify(match[0])}>{match[0]}</span>);
    last = match.index + match[0].length;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}

export default function RawContent({ data }) {
  return <pre className="raw__json">{tokenize(JSON.stringify(data, null, 2))}</pre>;
}
