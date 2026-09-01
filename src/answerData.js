// Small parsers over the assistant's Adaptive Card response, shared by the answer body (for inline
// citations) and the answer footer (for the "Behind the numbers" panel).

export function cards(raw) {
  return (raw?.content || []).map((c) => c.card).filter(Boolean);
}

// Flatten the response's citations into { n, label, reason, type, url, chartVid, expr }.
// chartVid is the card-body index of the chart a citation points at (used to jump to it).
export function extractSources(raw) {
  const out = [];
  cards(raw).forEach((card) => {
    const body = card.body || [];
    (card.citations || []).forEach((cit, i) => {
      const labels = [];
      const exprs = [];
      let reason = '';
      let type = '';
      let url = '';
      let chartVid = null;
      (cit.sources || []).forEach((s) => {
        type = s.type || type;
        url = s.url || url;
        if (s.title) labels.push(s.title); // document / knowledge-base source
        if (s.chart) {
          const idx = Number(String(s.chart).split('/').pop());
          if (chartVid == null) chartVid = idx;
          const es = body[idx]?.source;
          if (es) {
            (es.dimensions || []).forEach((d) => { d.label && labels.push(d.label); d.expression && exprs.push(d.expression); });
            (es.measures || []).forEach((m) => { m.label && labels.push(m.label); m.expression && exprs.push(m.expression); });
            if (es.reason && !reason) reason = es.reason;
          }
        }
      });
      out.push({
        n: i + 1,
        label: [...new Set(labels)].join(', '),
        reason,
        type,
        url,
        chartVid,
        expr: [...new Set(exprs)].join('  •  '),
      });
    });
  });
  return out;
}
