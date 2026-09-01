// The default questions in the briefing. Each one becomes a card, answered by Qlik Answers.
// Edit this list to change the built-in briefing, and keep the ids unique. People can also edit the
// questions in the app on the Setup page, which is saved in the browser and wins over these defaults.
// See README: Editing the briefing.
export const PROMPTS = [
  { id: 'revenue', text: 'What is our total revenue, and which product categories contribute the most?' },
  { id: 'regions', text: 'Which regions and customer segments generate the most revenue?' },
  { id: 'fulfillment', text: 'How do orders break down by status, and how many are not yet delivered?' },
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
