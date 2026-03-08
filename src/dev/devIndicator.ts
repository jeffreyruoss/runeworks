import { isDevActive } from './devSettings';

const INDICATOR_ID = 'dev-indicator-bar';

/** Creates or removes the fixed orange indicator bar at page top */
export function updateDevIndicator(): void {
  const existing = document.getElementById(INDICATOR_ID);

  if (!isDevActive()) {
    existing?.remove();
    return;
  }

  if (existing) return; // Already showing

  const bar = document.createElement('div');
  bar.id = INDICATOR_ID;
  Object.assign(bar.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '20px',
    backgroundColor: '#ff6600',
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: '12px',
    lineHeight: '20px',
    textAlign: 'center',
    zIndex: '9999',
    pointerEvents: 'none',
  });
  bar.textContent = 'DEV OVERRIDES ACTIVE';
  document.body.appendChild(bar);
}
