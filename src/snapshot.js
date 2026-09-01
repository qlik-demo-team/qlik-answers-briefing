// Turn a Qlik.Snapshot into a chart definition qlik-embed can draw "on the fly" (no saved object).
// qlik-embed only takes string expressions for measures/dimensions, so we pass those and keep the
// friendly labels (qLabel) separately for the UI. Master dimensions have no inline field, so we fall
// back to their computed title.

const inBrackets = (s) => {
  const v = String(s);
  return v.startsWith('[') ? v : `[${v}]`;
};

export function snapshotToDefinition(snapshot) {
  const props = snapshot?.object_properties || {};
  const cube = props.qHyperCubeDef || {};
  const dimInfo = snapshot?.data?.qHyperCube?.qDimensionInfo || [];

  const type = props.visualization || props.qInfo?.qType || 'kpi';

  const dimensions = [];
  const dimLabels = [];
  (cube.qDimensions || []).forEach((d, i) => {
    const field = d?.qDef?.qFieldDefs?.[0];
    const title = dimInfo[i]?.qFallbackTitle;
    const expr = field ? inBrackets(field) : title ? inBrackets(title) : null;
    if (!expr) return;
    dimensions.push(expr);
    dimLabels.push(d?.qDef?.qLabel || title || '');
  });

  const measures = [];
  const labels = [];
  (cube.qMeasures || []).forEach((m) => {
    const expr = m?.qDef?.qDef;
    if (!expr) return;
    measures.push(String(expr).startsWith('=') ? expr : `=${expr}`);
    labels.push(m?.qDef?.qLabel || '');
  });

  return { type, dimensions, measures, labels, dimLabels };
}
