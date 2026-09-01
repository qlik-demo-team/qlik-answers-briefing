import { memo } from 'react';
import { QlikEmbed, QlikEmbedConfig } from '@qlik/embed-react';
import { OAUTH_HOST_CONFIG } from './authConfig.js';

// Draws a Qlik chart on the fly (no saved object) as the logged-in user. <QlikEmbed> reads its host
// config from the QlikEmbedConfig provider. Without it the chart stays blank, so we pass the shared
// OAUTH_HOST_CONFIG. We add our own caption and hide qlik-embed's raw-expression title.
// See README: Notes and limitations (chart labels).
function QlikEmbedChart({ appId, type, dimensions = [], measures = [], label, height = 260 }) {
  const isKpi = type === 'kpi';
  const showOwnLabel = !!label;
  const properties = showOwnLabel
    ? isKpi
      ? { showTitles: false, showMeasureTitle: false, showSecondMeasureTitle: false }
      : { showTitles: false }
    : undefined;

  return (
    <QlikEmbedConfig.Provider value={OAUTH_HOST_CONFIG}>
      <div className="chart">
        {showOwnLabel && <div className="chart__label">{label}</div>}
        <div className="chart__frame" style={{ height: showOwnLabel ? height - 20 : height }}>
          <QlikEmbed
            ui="analytics/chart"
            appId={appId}
            type={type}
            dimensions={dimensions}
            measures={measures}
            properties={properties}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      </div>
    </QlikEmbedConfig.Provider>
  );
}

// Memoized so typing in a follow-up input does not reload the chart.
export default memo(QlikEmbedChart);
