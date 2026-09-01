import { useState } from 'react';
import Icon from '../Icon.jsx';

// Edit the questions that power the briefing. Each one becomes a card. Saving stores the list in the
// browser and re-runs the briefing. Reset goes back to the defaults in src/prompts.js.
// See README: Editing the briefing.
export default function SetupPage({ prompts, defaults, onSave, onCancel }) {
  const [list, setList] = useState(prompts);

  const update = (id, text) => setList(list.map((p) => (p.id === id ? { ...p, text } : p)));
  const remove = (id) => setList(list.filter((p) => p.id !== id));
  const add = () => setList([...list, { id: `p${list.length + 1}-${list.reduce((n, p) => n + p.text.length, 0)}`, text: '' }]);
  const reset = () => setList(defaults.map((p) => ({ ...p })));

  const isDefault = JSON.stringify(list) === JSON.stringify(defaults);
  const hasPrompt = list.some((p) => p.text.trim());

  function save() {
    onSave(list.filter((p) => p.text.trim()));
  }

  return (
    <section className="setup">
      <header className="setup__head">
        <h2 className="setup__title">Set up the briefing</h2>
        <p className="setup__lead">Each prompt below becomes one card on the briefing.</p>
      </header>

      <div className="setup__list">
        {list.map((p, i) => (
          <div className="prompt" key={p.id}>
            <div className="prompt__num">{i + 1}</div>
            <label className="prompt__field">
              <span className="prompt__label">Prompt</span>
              <input
                className="input"
                value={p.text}
                onChange={(e) => update(p.id, e.target.value)}
                placeholder="e.g. What are the top risks right now?"
                aria-label={`Prompt ${i + 1}`}
              />
            </label>
            <button
              className="prompt__remove"
              onClick={() => remove(p.id)}
              aria-label={`Remove prompt ${i + 1}`}
              title="Remove"
            >
              <Icon name="trash" size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="setup__actions">
        <div className="setup__actions-left">
          <button className="btn" onClick={add}>
            <Icon name="add" size={16} /> Add prompt
          </button>
          <button className="btn btn--quiet" onClick={reset} disabled={isDefault}>
            <Icon name="reload" size={16} /> Reset to defaults
          </button>
        </div>
        <div className="setup__actions-right">
          <button className="btn btn--quiet" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary" onClick={save} disabled={!hasPrompt}>Save and view briefing</button>
        </div>
      </div>
    </section>
  );
}
