import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Titled modal with a scrollable body. Closes on the close button / Esc / overlay; moves focus in,
// traps Tab, and restores focus on close. Used for the answer details (sources, reasoning, raw).
export default function Modal({ title, intro, onClose, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const restoreTo = document.activeElement;
    const panel = panelRef.current;
    (panel?.querySelector('.modal__close') || panel)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreTo?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="modal" ref={panelRef} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>
        {intro && <p className="modal__intro">{intro}</p>}
        <div className="modal__scroll">{children}</div>
      </div>
    </div>
  );
}
