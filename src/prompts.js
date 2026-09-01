// The default questions in the briefing. Each one becomes a card, answered by Qlik Answers.
// Edit this list to change the built-in briefing, and keep the ids unique. People can also edit the
// questions in the app on the Setup page, which is saved in the browser and wins over these defaults.
// See README: Editing the briefing.
export const PROMPTS = [
  { id: 'kpis', text: 'What are the top KPIs for the business this period?' },
  { id: 'risks', text: 'What are the most important risks or alerts right now?' },
];

const PROMPTS_KEY = 'qab:prompts';

// The prompts to actually run: the user's saved list if there is one, otherwise the defaults above.
export function loadPrompts() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROMPTS_KEY) || 'null');
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    // ignore malformed storage and fall back to the defaults
  }
  return PROMPTS;
}

export function savePrompts(list) {
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(list));
}
