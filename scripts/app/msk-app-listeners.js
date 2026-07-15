import { MSK } from '../utils/constants.js';
import {
  newTabTemplate,
  newEncounterTemplate,
  newCheckTemplate,
  nextSort,
} from '../utils/storage.js';
import { emitOpenApp } from '../utils/sockets.js';
import { resolveActorForUser, runKnowledgeCheck } from '../chat/roll-utils.js';

const KNOWLEDGE_TITLE_PREFIX_RE = /^(?=[^:]{1,90}:)(?=[^:]*\b(?:Arcana|Athletics|Acrobatics|Crafting|Deception|Diplomacy|Intimidation|Medicine|Nature|Occultism|Performance|Religion|Society|Stealth|Survival|Thievery|Perception|Lore|Computers|Piloting)\b)[^:]+:\s+/i;

function sidebarKnowledgeTitle(title) {
  const full = String(title ?? '');
  return full.replace(KNOWLEDGE_TITLE_PREFIX_RE, '').trim() || full;
}

async function confirmDialog({ title, content, yes = 'Delete', no = 'Cancel', defaultYes = false } = {}) {
  try {
    const proceed = await foundry.applications.api.DialogV2.confirm({
      window: { title: title ?? 'Confirm', classes: ['msk-confirm'], resizable: false },
      position: { width: 420, height: 'auto' },
      content: content ?? '<p>Are you sure?</p>',
      yes: { label: yes, icon: 'fa-solid fa-trash', default: !!defaultYes },
      no: { label: no, icon: 'fa-solid fa-xmark', default: !defaultYes },
      rejectClose: false,
      modal: true
    });
    return !!proceed;
  } catch (err) {
    console.error(`${MSK.ABBR}: confirmDialog failed`, err);
    return false;
  }
}

export function activateMSKAppListeners(html) {
  html.find('[data-action="toggle-tabs-collapse"]').on('click', async (ev) => {
    ev.preventDefault();
    this.mskState.uiState ??= {};
    this.mskState.uiState.tabsCollapsed = !Boolean(this.mskState.uiState.tabsCollapsed);
    if (game.user.isGM) await this._commitImmediate('toggle-tabs-collapse');
    this.render();
  });

  html.find('[data-action="select-home"]').on('click', async (ev) => {
    ev.preventDefault();
    this.selected.tabId = this.HOME_TAB_ID;
    this.selected.encounterId = null;
    if (this.mskState?.uiState) this.mskState.uiState.lastTabId = this.HOME_TAB_ID;
    this.render();
  });

  html.find('[data-action="select-tab"]').on('click', async (ev) => {
    const tabId = ev.currentTarget.dataset.tabId;
    this.selected.tabId = tabId;
    this.selected.encounterId = null;
    this._applySelectionFallbacks();
    if (game.user.isGM) await this._commitImmediate('select-tab');
    this.render();
  });

  html.find('[data-action="toggle-selected-tab-eye"]').on('click', async (ev) => {
    ev.stopPropagation();
    const tab = this._getSelectedTab();
    if (!tab) return;
    tab.tabSettings = tab.tabSettings ?? {};
    tab.tabSettings.showToPlayers = !tab.tabSettings.showToPlayers;
    await this._commitImmediate('toggle-tab-eye');
    this.render();
  });

  html.find('[data-action="delete-tab"]').on('click', async (ev) => {
    if (!game.user.isGM) return;
    ev.preventDefault();
    ev.stopPropagation();

    const tab = this._getSelectedTab();
    if (!tab) return;

    const ok = await confirmDialog({
      title: 'Delete Tab',
      content: '<p>Delete this tab and all encounters/checks inside it?</p>',
      yes: 'Delete Tab',
      no: 'Cancel',
      defaultYes: false,
    });
    if (!ok) return;

    this.mskState.tabs = (this.mskState.tabs ?? []).filter(t => t.id !== tab.id);
    this.selected.tabId = this.mskState.tabs?.[0]?.id ?? null;
    this.selected.encounterId = null;
    this._applySelectionFallbacks();
    await this._commitImmediate('delete-tab');
    this.render({ force: true });
  });

  html.find('[data-action="add-tab"]').on('click', async () => {
    if (!game.user.isGM) return;
    const name = String(html.find('input[name="newTabName"]').val() ?? '').trim();
    const t = newTabTemplate();
    if (name) t.name = name;
    html.find('input[name="newTabName"]').val('');
    t.sort = nextSort(this.mskState.tabs);
    this.mskState.tabs.push(t);
    this.selected.tabId = t.id;
    this.selected.encounterId = null;
    this._applySelectionFallbacks();
    await this._commitImmediate('add-tab');
    this.render();
  });

  html.find('[data-action="edit-tab-name"]').on('input', (ev) => {
    if (!game.user.isGM) return;
    const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
    if (!tab) return;
    tab.name = ev.currentTarget.value;
    this._commitDebounced('tab-name');
    const label = `${tab.name}${tab.title ? ' - ' + tab.title : ''}`;
    html.find(`.msk-tab[data-tab-id="${tab.id}"] .msk-tabLabel`).text(label);
  });

  html.find('[data-action="edit-tab-title"]').on('input', (ev) => {
    if (!game.user.isGM) return;
    const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
    if (!tab) return;
    tab.title = ev.currentTarget.value;
    this._commitDebounced('tab-title');
    const label = `${tab.name}${tab.title ? ' - ' + tab.title : ''}`;
    html.find(`.msk-tab[data-tab-id="${tab.id}"] .msk-tabLabel`).text(label);
  });

  html.find('input[name="tabDcAdjust"]').on('change', async (ev) => {
    if (!game.user.isGM) return;
    const valStr = ev.currentTarget.value;
    const val = Number(valStr);
    if (Number.isNaN(val)) {
      ui.notifications.warn(`${MSK.ABBR}: Adjust DC must be a number.`);
      const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
      if (tab) ev.currentTarget.value = tab.tabSettings?.dcAdjust ?? 0;
      return;
    }
    const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
    if (!tab) return;
    tab.tabSettings.dcAdjust = Math.trunc(val);
    ev.currentTarget.value = tab.tabSettings.dcAdjust;
    await this._commitImmediate('tab-dc-change');
    this.render();
  });

  html.find('[data-action="reset-tab-dc"]').on('click', async () => {
    if (!game.user.isGM) return;
    const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
    if (!tab) return;
    tab.tabSettings.dcAdjust = 0;
    await this._commitImmediate('reset-tab-dc');
    this.render();
  });

  html.find('[data-action="select-encounter"]').on('click', async (ev) => {
    const encId = ev.currentTarget.dataset.encounterId;
    this.selected.encounterId = encId;
    this._applySelectionFallbacks();
    if (game.user.isGM) await this._commitImmediate('select-encounter');
    this.render();
  });

  html.find('[data-action="toggle-encounter-eye"]').on('click', async (ev) => {
    ev.stopPropagation();
    if (!game.user.isGM) return;
    const encId = ev.currentTarget.dataset.encounterId;
    const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
    const enc = tab?.encounters?.find(e => e.id === encId);
    if (!enc) return;
    enc.encounterSettings = enc.encounterSettings ?? {};
    enc.encounterSettings.showToPlayers = !enc.encounterSettings.showToPlayers;
    await this._commitImmediate('toggle-encounter-eye');
    this.render();
  });

  html.find('[data-action="delete-encounter"]').on('click', async (ev) => {
    if (!game.user.isGM) return;
    ev.preventDefault();
    ev.stopPropagation();

    const encId = ev.currentTarget.dataset.encounterId ?? this.selected.encounterId;
    const tab = this._getSelectedTab();
    if (!tab || !encId) return;

    const ok = await confirmDialog({
      title: 'Delete Encounter',
      content: '<p>Delete this encounter and all checks/results?</p>',
      yes: 'Delete Encounter',
      no: 'Cancel',
      defaultYes: false,
    });
    if (!ok) return;

    tab.encounters = (tab.encounters ?? []).filter(e => e.id !== encId);
    this.selected.encounterId = null;
    this._applySelectionFallbacks();
    await this._commitImmediate('delete-encounter');
    this.render({ force: true });
  });

  html.find('[data-action="add-encounter"]').on('click', async () => {
    if (!game.user.isGM) return;
    const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
    if (!tab) return;
    const e = newEncounterTemplate();
    e.sort = nextSort(tab.encounters);
    tab.encounters.push(e);
    this.selected.encounterId = e.id;
    this._applySelectionFallbacks();
    await this._commitImmediate('add-encounter');
    this.render();
  });

  html.find('[data-action="edit-encounter-title"]').on('input', (ev) => {
    if (!game.user.isGM) return;
    const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
    const enc = tab?.encounters?.find(e => e.id === this.selected.encounterId);
    if (!enc) return;
    enc.title = ev.currentTarget.value;
    this._commitDebounced('enc-title');
    html.find(`.msk-encRow[data-encounter-id="${enc.id}"]`)
      .attr('title', enc.title)
      .find('.msk-encTitle')
      .text(sidebarKnowledgeTitle(enc.title));
  });

  html.find('[data-action="edit-encounter-description"]').on('input', (ev) => {
    if (!game.user.isGM) return;
    const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
    const enc = tab?.encounters?.find(e => e.id === this.selected.encounterId);
    if (!enc) return;
    enc.descriptionHtml = ev.currentTarget.value;
    this._commitDebounced('enc-desc');
  });

  html.find('[data-action="toggle-enc-show"]').on('change', async (ev) => {
    if (!game.user.isGM) return;
    const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
    const enc = tab?.encounters?.find(e => e.id === this.selected.encounterId);
    if (!enc) return;
    enc.encounterSettings.showToPlayers = ev.currentTarget.checked;
    await this._commitImmediate('enc-show');
  });

  html.find('[data-action="send-to-chat"]').on('click', async () => {
    if (!game.user.isGM) return;
    await this._sendEncounterToChat(html);
  });

  html.find('[data-action="open-for-players"]').on('click', async () => {
    if (!game.user.isGM) return;
    emitOpenApp({ target: 'all', focus: true, ui: this.getCurrentUiSelection(), reason: 'gm-push' });
  });

  html.find('[data-action="toggle-gm-view-as-player"]').on('click', async (ev) => {
    if (!game.user.isGM) return;
    ev.preventDefault();
    ev.stopPropagation();
    this._gmViewAsPlayer = !this._gmViewAsPlayer;
    this.render();
  });

  html.find('[data-action="json-tools"]').on('click', async (ev) => {
    if (!game.user.isGM) return;
    ev.preventDefault();
    ev.stopPropagation();
    await this._openJsonToolsDialog();
  });

  html.find('[data-action="add-check"]').on('click', async () => {
    if (!game.user.isGM) return;
    const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
    const enc = tab?.encounters?.find(e => e.id === this.selected.encounterId);
    if (!enc) return;
    const c = newCheckTemplate();
    c.sort = nextSort(enc.checks);
    enc.checks.push(c);
    await this._commitImmediate('add-check');
    this.render();
  });

  html.find('[data-action="delete-check"]').on('click', async (ev) => {
    if (!game.user.isGM) return;
    ev.preventDefault();
    ev.stopPropagation();

    const ok = await confirmDialog({
      title: 'Delete Check',
      content: '<p>Delete this check?</p>',
      yes: 'Delete Check',
      no: 'Cancel',
      defaultYes: false,
    });
    if (!ok) return;

    const checkId = ev.currentTarget.dataset.checkId;
    const enc = this._getSelectedEncounter();
    if (!enc || !checkId) return;
    enc.checks = (enc.checks ?? []).filter(c => c.id !== checkId);
    await this._commitImmediate('delete-check');
    this.render();
  });

  html.find('[data-action="edit-encounter-result"]').on('change', async (ev) => {
    if (!game.user.isGM) return;
    const key = ev.currentTarget.dataset.resultKey;
    const enc = this._getSelectedEncounter();
    if (!enc || !key) return;
    enc.results = enc.results ?? {};
    enc.results[key] = ev.currentTarget.value ?? '';
    await this._commitDebounced('edit-encounter-result');
  });

  html.find('[data-action="edit-check-field"]').on('input', (ev) => {
    if (!game.user.isGM) return;
    const checkId = ev.currentTarget.dataset.checkId;
    const field = ev.currentTarget.dataset.field;
    const chk = this._getSelectedCheck(checkId);
    if (!chk) return;
    if (field === 'label') chk.label = ev.currentTarget.value;
    if (field === 'dc') chk.dc = Number(ev.currentTarget.value);
    this._commitDebounced('check-field');
  });

  html.find('[data-action="edit-check-skill"]').on('change', (ev) => {
    if (!game.user.isGM) return;
    const checkId = ev.currentTarget.dataset.checkId;
    const chk = this._getSelectedCheck(checkId);
    if (!chk) return;
    chk.skill = { type: 'skill', slug: ev.currentTarget.value };
    this._commitDebounced('check-skill');
  });

  html.find('[data-action="edit-check-type"]').on('change', (ev) => {
    if (!game.user.isGM) return;
    const checkId = ev.currentTarget.dataset.checkId;
    const chk = this._getSelectedCheck(checkId);
    if (!chk) return;
    const type = ev.currentTarget.value;
    if (type === 'lore') chk.skill = { type: 'lore', name: 'New Lore' };
    else if (type === 'save') chk.skill = { type: 'save', slug: 'fortitude' };
    else chk.skill = { type: 'skill', slug: 'society' };
    this._commitDebounced('check-type');
    this.render();
  });

  html.find('[data-action="edit-check-lore"]').on('input', (ev) => {
    if (!game.user.isGM) return;
    const checkId = ev.currentTarget.dataset.checkId;
    const chk = this._getSelectedCheck(checkId);
    if (!chk) return;
    chk.skill = { type: 'lore', name: ev.currentTarget.value };
    this._commitDebounced('check-lore');
  });

  html.find('[data-action="edit-result"]').on('click', async (ev) => {
    if (!game.user.isGM) return;
    const checkId = ev.currentTarget.dataset.checkId;
    const key = ev.currentTarget.dataset.key;
    const chk = this._getSelectedCheck(checkId);
    if (!chk) return;
    const current = chk.results?.[key] ?? '';
    const updated = await this._promptHtmlEditor(key, current);
    if (updated === null) return;
    chk.results[key] = updated;
    await this._commitImmediate('edit-result');
    this.render();
  });

  html.find('[data-action="player-roll"], [data-action="roll-check"]').on('click', async (ev) => {
    const checkId = ev.currentTarget.dataset.checkId;
    const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
    const enc = tab?.encounters?.find(e => e.id === this.selected.encounterId);
    const chk = enc?.checks?.find(c => c.id === checkId);
    if (!tab || !enc || !chk) {
      ui.notifications.warn(`${MSK.ABBR}: This check isn’t available.`);
      return;
    }

    if (!game.user.isGM) {
      const blockTab = game.settings.get(MSK.ID, 'blockRollIfTabHidden');
      const blockEnc = game.settings.get(MSK.ID, 'blockRollIfEncounterHidden');
      if (blockTab && tab.tabSettings?.showToPlayers === false) return ui.notifications.warn(`${MSK.ABBR}: This check isn’t available.`);
      if (blockEnc && enc.encounterSettings?.showToPlayers === false) return ui.notifications.warn(`${MSK.ABBR}: This check isn’t available.`);
      if (chk.checkSettings?.showToPlayers === false) return ui.notifications.warn(`${MSK.ABBR}: This check isn’t available.`);
    }

    const actor = resolveActorForUser(game.user);
    if (!actor) {
      ui.notifications.warn(`${MSK.ABBR}: No default character, selected owned token, or single owned character found.`);
      return;
    }

    await runKnowledgeCheck({ state: this.mskState, tab, enc, chk, actor, source: 'app' });
  });

  const builder = html.find('[data-msk-check-builder]');
  if (builder?.length) {
    const typeSel = builder.find('[data-role="msk-type"]');
    const syncBuilder = () => {
      const v = String(typeSel.val() ?? 'skill');
      builder.toggleClass('is-lore', v === 'lore');
      builder.toggleClass('is-save', v === 'save');
    };
    typeSel.on('change', () => { syncBuilder(); });
    syncBuilder();
  }

  html.find('[data-action="add-check-from-builder"]').on('click', async (ev) => {
    ev.preventDefault();
    if (!game.user.isGM) return;
    const enc = this._getSelectedEncounter();
    if (!enc) return;

    const b = html.find('[data-msk-check-builder]');
    const type = String(b.find('[data-role="msk-type"]').val() ?? 'skill');
    const skillSlug = String(b.find('[data-role="msk-skill"]').val() ?? 'society');
    const saveSlug = String(b.find('[data-role="msk-save"]').val() ?? 'fortitude');
    const loreName = String(b.find('[data-role="msk-lore"]').val() ?? '').trim();
    const dcNum = Number(b.find('[data-role="msk-dc"]').val() ?? 0);
    const desc = String(b.find('[data-role="msk-desc"]').val() ?? '').trim();

    const chk = newCheckTemplate();
    chk.description = desc;
    chk.dc = Number.isNaN(dcNum) ? 0 : Math.trunc(dcNum);
    chk.checkSettings = chk.checkSettings ?? {};
    chk.checkSettings.showToPlayers = true;
    chk.skill = type === 'lore'
      ? { type: 'lore', name: loreName || 'Lore' }
      : (type === 'save'
        ? { type: 'save', slug: saveSlug }
        : { type: 'skill', slug: skillSlug });

    enc.checks = enc.checks ?? [];
    chk.sort = nextSort(enc.checks);
    enc.checks.push(chk);

    b.find('[data-role="msk-desc"]').val('');
    await this._commitImmediate('add-check-from-builder');
    this.render();
  });

  html.find('[data-action="toggle-check-eye"]').on('click', async (ev) => {
    if (!game.user.isGM) return;
    ev.preventDefault();
    ev.stopPropagation();
    const checkId = ev.currentTarget.dataset.checkId;
    const chk = this._getSelectedCheck(checkId);
    if (!chk) return;
    chk.checkSettings = chk.checkSettings ?? {};
    chk.checkSettings.showToPlayers = !(chk.checkSettings.showToPlayers !== false);
    await this._commitImmediate('toggle-check-eye');
    this.render();
  });

  html.find('[data-action="edit-check-desc"]').on('input', (ev) => {
    if (!game.user.isGM) return;
    const checkId = ev.currentTarget.dataset.checkId;
    const chk = this._getSelectedCheck(checkId);
    if (!chk) return;
    chk.description = ev.currentTarget.value ?? '';
    this._commitDebounced('edit-check-desc');
  });
}
