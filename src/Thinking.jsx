import { useEffect, useRef, useState } from 'react';

// The API does not report progress, so we show a fake progress bar that eases toward the end with a
// rotating label. The labels are generic because we cannot see the assistant's real steps.
const STAGES = ['Working on it', 'Analyzing your data', 'Pulling the insights together', 'Almost ready'];

// mode sets the expected wait; pass a fixed `label` to skip the rotating stages.
export default function Thinking({ mode = 'think', label }) {
  const expected = mode === 'fast' ? 18000 : 50000; // rough guess, in ms
  const [pct, setPct] = useState(6);
  const [stage, setStage] = useState(0);
  const start = useRef(0);

  useEffect(() => {
    start.current = Date.now();
    const tau = expected / 2.3;
    const perStage = expected / STAGES.length;
    const id = setInterval(() => {
      const elapsed = Date.now() - start.current;
      const eased = 1 - Math.exp(-elapsed / tau);
      setPct(Math.min(95, 6 + eased * 89)); // never quite hits 100 until the answer lands
      setStage(Math.min(STAGES.length - 1, Math.floor(elapsed / perStage)));
    }, 200);
    return () => clearInterval(id);
  }, [expected]);

  return (
    <div className="thinking" role="status" aria-live="polite">
      <span className="thinking__label">{label || STAGES[stage]}…</span>
      <div className="thinking__track">
        <div className="thinking__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
