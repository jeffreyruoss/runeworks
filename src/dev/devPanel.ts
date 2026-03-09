import { GameMode, PlayerResources } from '../types';
import { RESEARCH_NODES } from '../data/research';
import { STAGES } from '../data/stages';
import { TUTORIALS } from '../data/tutorials';
import { loadDevSettings, saveDevSettings, clearDevSettings, DevSettings } from './devSettings';
import { updateDevIndicator } from './devIndicator';

const PANEL_ID = 'dev-settings-panel';
const RESOURCE_KEYS: (keyof PlayerResources)[] = ['stone', 'wood', 'iron', 'clay', 'crystal_shard'];
const GAME_MODES: (GameMode | '')[] = ['', 'tutorial', 'stages', 'sandbox'];

function createPanel(): HTMLDivElement {
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  Object.assign(panel.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    width: '340px',
    height: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
    fontFamily: 'monospace',
    fontSize: '12px',
    overflowY: 'auto',
    zIndex: '10000',
    padding: '12px',
    boxSizing: 'border-box',
    display: 'none',
    borderLeft: '2px solid #ff6600',
  });

  // Prevent game from receiving keyboard events while typing in panel
  panel.addEventListener('keydown', (e) => e.stopPropagation());
  panel.addEventListener('keyup', (e) => e.stopPropagation());
  panel.addEventListener('keypress', (e) => e.stopPropagation());

  const settings = loadDevSettings();
  panel.innerHTML = buildPanelHTML(settings);
  document.body.appendChild(panel);

  // Wire up buttons after innerHTML is set
  panel.querySelector('#dev-apply')?.addEventListener('click', applyAndReload);
  panel.querySelector('#dev-reset')?.addEventListener('click', resetAndReload);

  return panel;
}

function buildPanelHTML(s: DevSettings): string {
  const isSelected = (m: GameMode | ''): boolean => (m ? s.autoStartMode === m : !s.autoStartMode);
  const modeOptions = GAME_MODES.map(
    (m) => `<option value="${m}" ${isSelected(m) ? 'selected' : ''}>${m || '(none)'}</option>`
  ).join('');

  const resourceInputs = RESOURCE_KEYS.map((key) => {
    const val = s.resources?.[key];
    return `<label style="display:block;margin:2px 0">${key}: <input type="number" min="0" data-res="${key}" value="${val ?? ''}" style="${inputStyle()}" placeholder="—"></label>`;
  }).join('');

  const researchChecks = RESEARCH_NODES.map((n) => {
    const checked = s.researchUnlocks?.includes(n.id) ? 'checked' : '';
    return `<label style="display:block;margin:1px 0"><input type="checkbox" data-node="${n.id}" ${checked}> ${n.name} (${n.branch}, ${n.cost}RP)</label>`;
  }).join('');

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-size:14px;font-weight:bold;color:#ff6600">DEV SETTINGS</span>
      <label><input type="checkbox" id="dev-enabled" ${s.enabled ? 'checked' : ''}> Enabled</label>
    </div>
    <hr style="border-color:#333">

    <div style="margin:8px 0">
      <b>Auto-start mode</b><br>
      <select id="dev-mode" style="${selectStyle()}">${modeOptions}</select>
    </div>

    <div style="margin:8px 0">
      <b>Start stage</b><br>
      <select id="dev-stage" style="${selectStyle()}">${buildStageOptions(s.startStage)}</select>
    </div>

    <div style="margin:8px 0">
      <b>Tutorial step</b><br>
      <select id="dev-tutorial" style="${selectStyle()}">${buildTutorialOptions(s.tutorialStep)}</select>
    </div>

    <div style="margin:8px 0">
      <b>Starting resources</b> (empty = no override)<br>
      ${resourceInputs}
    </div>

    <div style="margin:8px 0">
      <b>Research points</b><br>
      <input type="number" id="dev-rp" min="0" value="${s.researchPoints ?? ''}" style="${inputStyle()}" placeholder="—">
    </div>

    <div style="margin:8px 0">
      <b>Force-unlock research</b><br>
      <div style="max-height:120px;overflow-y:auto;border:1px solid #333;padding:4px">
        ${researchChecks}
      </div>
    </div>

    <div style="margin-top:12px;display:flex;gap:8px">
      <button id="dev-apply" style="${buttonStyle('#ff6600')}">Apply & Reload</button>
      <button id="dev-reset" style="${buttonStyle('#666')}">Reset All</button>
    </div>
  `;
}

function inputStyle(): string {
  return 'background:#0f0f23;color:#e0e0e0;border:1px solid #444;padding:2px 4px;width:60px;font-family:monospace;font-size:12px';
}

function selectStyle(): string {
  return 'background:#0f0f23;color:#e0e0e0;border:1px solid #444;padding:2px 4px;font-family:monospace;font-size:12px';
}

function buildStageOptions(selected: number | null): string {
  const none = `<option value="">(none)</option>`;
  const opts = STAGES.map(
    (st) =>
      `<option value="${st.id}" ${selected === st.id ? 'selected' : ''}>Stage ${st.id}: ${st.name}</option>`
  ).join('');
  return none + opts;
}

function buildTutorialOptions(selected: number | null): string {
  const none = `<option value="">(none)</option>`;
  const opts = TUTORIALS.map(
    (t) =>
      `<option value="${t.id}" ${selected === t.id ? 'selected' : ''}>${t.id}. ${t.name}</option>`
  ).join('');
  return none + opts;
}

function buttonStyle(bg: string): string {
  return `background:${bg};color:#fff;border:none;padding:6px 12px;cursor:pointer;font-family:monospace;font-size:12px;font-weight:bold`;
}

function readFormSettings(): DevSettings {
  const panel = document.getElementById(PANEL_ID)!;
  const enabled = (panel.querySelector('#dev-enabled') as HTMLInputElement).checked;
  const modeVal = (panel.querySelector('#dev-mode') as HTMLSelectElement).value;
  const stageVal = (panel.querySelector('#dev-stage') as HTMLSelectElement).value;
  const tutorialVal = (panel.querySelector('#dev-tutorial') as HTMLSelectElement).value;
  const rpVal = (panel.querySelector('#dev-rp') as HTMLInputElement).value;

  // Resources: only set if at least one field has a value
  let resources: Partial<PlayerResources> | null = null;
  for (const key of RESOURCE_KEYS) {
    const input = panel.querySelector(`[data-res="${key}"]`) as HTMLInputElement;
    if (input.value !== '') {
      if (!resources) resources = {};
      resources[key] = parseInt(input.value, 10) || 0;
    }
  }

  // Research unlocks
  const checkboxes = panel.querySelectorAll<HTMLInputElement>('[data-node]');
  const unlocks: string[] = [];
  checkboxes.forEach((cb) => {
    if (cb.checked) unlocks.push(cb.dataset.node!);
  });

  return {
    enabled,
    autoStartMode: modeVal ? (modeVal as GameMode) : null,
    startStage: stageVal ? parseInt(stageVal, 10) : null,
    tutorialStep: tutorialVal ? parseInt(tutorialVal, 10) : null,
    resources,
    researchUnlocks: unlocks.length > 0 ? unlocks : null,
    researchPoints: rpVal ? parseInt(rpVal, 10) : null,
  };
}

function applyAndReload(): void {
  saveDevSettings(readFormSettings());
  window.location.reload();
}

function resetAndReload(): void {
  clearDevSettings();
  window.location.reload();
}

function togglePanel(): void {
  let panel = document.getElementById(PANEL_ID) as HTMLDivElement | null;
  if (!panel) panel = createPanel();
  const isVisible = panel.style.display !== 'none';
  panel.style.display = isVisible ? 'none' : 'block';
}

/** Call once after Phaser game is created. Sets up backtick toggle + indicator. */
export function initDevTools(): void {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote') {
      e.preventDefault();
      togglePanel();
    }
  });
  updateDevIndicator();
}
