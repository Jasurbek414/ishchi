import { useCallback, useEffect, useId, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The dialog shell every modal in the panel shares.
 *
 * Each page used to inline its own backdrop and panel, which meant none of them could be closed
 * with Escape, focus stayed behind on the page underneath, Tab wandered out of the dialog into the
 * table behind it, and assistive technology was never told a dialog had opened. Doing it once here
 * fixes all of that everywhere.
 */
export default function Modal({ title, onClose, children, labelledBy, ariaLabel, panelClassName = '' }) {
  const panelRef = useRef(null);
  const titleId = useId();
  // Only point at a heading that exists: a dialog without a title (the banner editor leads with a
  // preview instead) gets a plain label rather than a dangling reference.
  const headingId = labelledBy ?? (title != null ? titleId : undefined);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      // Keep Tab inside the dialog: without this, focus walks into the page behind the backdrop.
      const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const firstField = panelRef.current?.querySelector(FOCUSABLE);
    (firstField ?? panelRef.current)?.focus();

    return () => {
      document.body.style.overflow = overflow;
      // Put the caret back where the user left it, so closing a dialog does not lose their place.
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className={`modal ${panelClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-label={headingId ? undefined : ariaLabel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {title != null && <h3 id={headingId}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
