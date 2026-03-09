import { isDevActive } from './devSettings';

const INDICATOR_ID = 'dev-indicator-bar';

/** Creates or removes the fixed orange pill badge in the top-right corner */
export function updateDevIndicator(): void {
  const existing = document.getElementById(INDICATOR_ID);

  if (!isDevActive()) {
    existing?.remove();
    return;
  }

  if (existing) return; // Already showing

  const badge = document.createElement('div');
  badge.id = INDICATOR_ID;
  Object.assign(badge.style, {
    position: 'fixed',
    top: '8px',
    right: '8px',
    padding: '2px 10px',
    backgroundColor: '#ff6600',
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: '11px',
    lineHeight: '16px',
    borderRadius: '10px',
    opacity: '0.85',
    zIndex: '9999',
    pointerEvents: 'none',
  });
  badge.textContent = 'DEV';
  document.body.appendChild(badge);
}
