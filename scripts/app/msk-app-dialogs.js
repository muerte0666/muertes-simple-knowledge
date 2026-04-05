import { MSK } from '../utils/constants.js';
import { hexToRgba } from '../utils/color.js';
import { ensureMigratedState, setWorldState } from '../utils/storage.js';
import { emitStateUpdated } from '../utils/sockets.js';
import { buildEncounterChatButtons } from '../utils/check-display.js';

const getTextEditorImpl = () => foundry?.applications?.ux?.TextEditor?.implementation ?? Object.getOwnPropertyDescriptor(globalThis, 'TextEditor')?.value;

async function confirmDialogV2({ title = 'Confirm', content = '<p>Are you sure?</p>', yes = 'Confirm', no = 'Cancel', defaultYes = false } = {}) {
  try {
    const result = await foundry.applications.api.DialogV2.confirm({
      window: { title, classes: ['msk-confirm'], resizable: false },
      position: { width: 420, height: 'auto' },
      content,
      yes: { label: yes, icon: 'fa-solid fa-check', default: !!defaultYes },
      no: { label: no, icon: 'fa-solid fa-xmark', default: !defaultYes },
      rejectClose: false,
      modal: true
    });
    return result === true;
  } catch (err) {
    console.error(`${MSK.ABBR}: DialogV2 confirm failed`, err);
    return false;
  }
}

export async function promptHtmlEditor(titleKey, currentHtml) {
  const titleMap = {
    criticalSuccessHtml: 'Critical Success',
    criticalSuccessGmNoteHtml: 'Critical Success GM Note',
    successHtml: 'Success',
    successGmNoteHtml: 'Success GM Note',
    failureHtml: 'Failure',
    failureGmNoteHtml: 'Failure GM Note',
    criticalFailureHtml: 'Critical Failure',
    criticalFailureGmNoteHtml: 'Critical Failure GM Note',
    gmOnlyNotesHtml: 'GM Notes'
  };

  return await foundry.applications.api.DialogV2.prompt({
    window: { title: 'MSK — Edit Result', classes: ['msk-result-editor'], resizable: true },
    position: { width: 620, height: 'auto' },
    content: `
      <p><strong>${foundry.utils.escapeHTML(titleMap[titleKey] ?? titleKey)}</strong></p>
      <textarea style="width: 100%; min-height: 280px;" name="mskResult" autofocus>${foundry.utils.escapeHTML(currentHtml)}</textarea>
      <p class="notes">(HTML supported. You can use Foundry @UUID links; output is enriched.)</p>
    `,
    ok: {
      label: 'Save',
      icon: 'fa-solid fa-floppy-disk',
      callback: (_event, button) => String(button.form?.elements?.mskResult?.value ?? '')
    },
    rejectClose: false,
    modal: true
  });
}

export async function sendEncounterToChat(html) {
  const tab = this.mskState.tabs.find(t => t.id === this.selected.tabId);
  const enc = tab?.encounters?.find(e => e.id === this.selected.encounterId);
  if (!tab || !enc) return;

  const includeDescription = Boolean(html.find('input[name="includeDesc"]').prop('checked'));
  const checks = (enc.checks ?? []).filter(c => c?.checkSettings?.showToPlayers !== false);
  if (!checks.length) {
    ui.notifications.warn(`${MSK.ABBR}: This encounter has no player-visible checks to send.`);
    return;
  }

  const desc = includeDescription ? await getTextEditorImpl().enrichHTML(enc.descriptionHtml ?? '', { async: true }) : '';
  const hideDCWorld = game.settings.get(MSK.ID, 'hideDCFromPlayers');
  const playerButtons = buildEncounterChatButtons(checks, {
    tabDcAdjust: Number(tab.tabSettings?.dcAdjust ?? 0),
    showDC: (check) => {
      const hideDC = check?.checkSettings?.hideDCFromPlayers ?? enc.encounterSettings?.hideDCFromPlayers ?? hideDCWorld;
      return !hideDC;
    },
  });
  const gmButtons = buildEncounterChatButtons(checks, {
    tabDcAdjust: Number(tab.tabSettings?.dcAdjust ?? 0),
    showDC: () => true,
  });
  const cardsDiffer = playerButtons.some((button, index) => button.showDC !== gmButtons[index]?.showDC);

  const _renderTemplate = foundry?.applications?.handlebars?.renderTemplate ?? globalThis.renderTemplate;
  const content = await _renderTemplate(`modules/${MSK.ID}/templates/chat/encounter-card.hbs`, {
    contractV: MSK.CONTRACT_V,
    moduleName: MSK.NAME,
    title: enc.title,
    description: desc,
    includeDescription,
    tabId: tab.id,
    encounterId: enc.id,
    checks: playerButtons,
    chatAccent: game.settings.get(MSK.ID, 'chatCardAccentColor'),
    chatFill: game.settings.get(MSK.ID, 'chatCardFillOpacity'),
    chatFillColor: hexToRgba(game.settings.get(MSK.ID, 'chatCardAccentColor'), game.settings.get(MSK.ID, 'chatCardFillOpacity')),
  });

  await ChatMessage.create({
    content,
    flags: {
      [MSK.ID]: {
        v: MSK.CONTRACT_V,
        type: 'encounter-card',
        tabId: tab.id,
        encounterId: enc.id,
        includeDescription,
        createdAt: Date.now(),
      }
    }
  });

  if (!cardsDiffer) return;

  const gmContent = await _renderTemplate(`modules/${MSK.ID}/templates/chat/encounter-card.hbs`, {
    contractV: MSK.CONTRACT_V,
    moduleName: MSK.NAME,
    title: enc.title,
    description: desc,
    includeDescription,
    tabId: tab.id,
    encounterId: enc.id,
    checks: gmButtons,
    chatAccent: game.settings.get(MSK.ID, 'chatCardAccentColor'),
    chatFill: game.settings.get(MSK.ID, 'chatCardFillOpacity'),
    chatFillColor: hexToRgba(game.settings.get(MSK.ID, 'chatCardAccentColor'), game.settings.get(MSK.ID, 'chatCardFillOpacity')),
  });

  await ChatMessage.create({
    content: gmContent,
    whisper: game.users.filter(user => user.isGM).map(user => user.id),
    flags: {
      [MSK.ID]: {
        v: MSK.CONTRACT_V,
        type: 'encounter-card',
        tabId: tab.id,
        encounterId: enc.id,
        includeDescription,
        gmCard: true,
        createdAt: Date.now(),
      }
    }
  });
}

export async function openJsonToolsDialog() {
  if (!this._requireGM('json-tools')) return;

  const state = this.mskState;
  const tab = this._getSelectedTab();
  const tabName = tab?.name ?? 'Tab';
  const exportTab = () => JSON.stringify(tab ?? {}, null, 2);
  const exportAll = () => JSON.stringify(state ?? {}, null, 2);

  const content = `
    <div class="msk-json-tools">
      <div class="msk-json-top">
        <div class="msk-json-col">
          <div class="msk-json-title">Export</div>
          <div class="msk-json-grid msk-json-grid-3">
            <button type="button" data-action="exp-tab" class="msk-json-btn msk-json-btn-export">Selected Tab</button>
            <button type="button" data-action="exp-all" class="msk-json-btn msk-json-btn-export">All Tabs</button>
            <button type="button" data-action="dl-json" class="msk-json-btn msk-json-btn-export">Download</button>
          </div>
        </div>

        <div class="msk-json-col">
          <div class="msk-json-title">Import <span class="msk-muted">(GM only)</span></div>
          <div class="msk-json-grid msk-json-grid-2">
            <button type="button" data-action="imp-tab" class="msk-json-btn msk-json-btn-import">Into “${foundry.utils.escapeHTML(tabName)}”</button>
            <button type="button" data-action="imp-all" class="msk-json-btn msk-json-btn-import">All Tabs</button>
          </div>
        </div>
      </div>

      <textarea name="json" rows="16" class="msk-json-text" spellcheck="false" placeholder="Click Export to generate JSON, or paste JSON here to import."></textarea>
      <div class="msk-json-help">Paste JSON above. Import replaces data.</div>
    </div>
  `;

  const dlg = new foundry.applications.api.DialogV2({
    window: { title: `${MSK.ABBR}: JSON Tools` },
    content,
    buttons: [{ action: 'close', label: 'Close', default: true }]
  }, { position: { width: 620 } });

  await dlg.render({ force: true });

  const root = (dlg.element instanceof HTMLElement)
    ? dlg.element
    : (dlg.element?.[0] instanceof HTMLElement)
      ? dlg.element[0]
      : null;
  if (!root) return;

  const ta = root.querySelector('textarea[name="json"]');
  const getText = () => (ta?.value ?? '').trim();
  const setText = (v) => { if (ta) ta.value = v ?? ''; };

  let lastExportMode = 'tab';

  const sanitizeName = (s) => String(s ?? 'tab')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_.]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '') || 'tab';

  const timestamp = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  };

  const downloadName = () => {
    const ts = timestamp();
    if (lastExportMode === 'all') return `msk-all-tabs-${ts}.json`;
    return `msk-tab-${sanitizeName(tabName)}-${ts}.json`;
  };

  setText(exportTab());
  lastExportMode = 'tab';

  root.addEventListener('click', async (ev) => {
    const btn = ev.target?.closest?.('button[data-action]');
    if (!btn) return;
    ev.preventDefault();

    const action = btn.dataset.action;

    if (action === 'exp-tab') {
      setText(exportTab());
      lastExportMode = 'tab';
      return;
    }

    if (action === 'exp-all') {
      setText(exportAll());
      lastExportMode = 'all';
      return;
    }

    if (action === 'dl-json') {
      const data = getText() || exportTab();
      const filename = downloadName();
      if (globalThis.saveDataToFile) {
        globalThis.saveDataToFile(data, 'application/json', filename);
        return;
      }
      const blob = new Blob([data], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return;
    }

    if (!game.user.isGM) {
      ui.notifications.warn(`${MSK.ABBR}: Only a GM can import.`);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(getText());
    } catch (err) {
      ui.notifications.error(`${MSK.ABBR}: Invalid JSON.`);
      console.error(err);
      return;
    }

    if (action === 'imp-tab') {
      if (!tab?.id) {
        ui.notifications.error(`${MSK.ABBR}: No tab selected.`);
        return;
      }

      const ok = await confirmDialogV2({
        title: 'Import Selected Tab',
        content: '<p>This replaces the selected tab with the imported data.</p>',
        yes: 'Import Tab',
        no: 'Cancel',
        defaultYes: false,
      });
      if (!ok) return;

      const next = foundry.utils.deepClone(state);
      const incomingTab = Array.isArray(parsed?.tabs)
        ? (parsed.tabs.find(t => t?.id === tab.id) ?? null)
        : parsed;

      const migratedIncoming = ensureMigratedState({ schemaVersion: this.mskState?.schemaVersion ?? 2, tabs: [incomingTab] });
      const incomingTabNormalized = migratedIncoming?.tabs?.[0] ?? incomingTab;

      if (!incomingTab || !incomingTab.encounters) {
        ui.notifications.error(`${MSK.ABBR}: JSON is not a tab export.`);
        return;
      }

      const idx = next.tabs?.findIndex?.(t => t?.id === tab.id) ?? -1;
      if (idx < 0) {
        ui.notifications.error(`${MSK.ABBR}: Selected tab not found in state.`);
        return;
      }

      next.tabs[idx] = foundry.utils.mergeObject(next.tabs[idx], incomingTabNormalized, { inplace: false, overwrite: true, insertKeys: true, insertValues: true });

      await setWorldState(next);
      emitStateUpdated();
      this.mskState = next;
      ui.notifications.info(`${MSK.ABBR}: Imported tab.`);
      this.render({ force: true });
      return;
    }

    if (action === 'imp-all') {
      if (!Array.isArray(parsed?.tabs)) {
        ui.notifications.error(`${MSK.ABBR}: JSON is not a full export.`);
        return;
      }

      const ok = await confirmDialogV2({
        title: 'Import All Tabs',
        content: '<p>This replaces all MSK tabs with the imported data.</p>',
        yes: 'Import All',
        no: 'Cancel',
        defaultYes: false,
      });
      if (!ok) return;
      const migratedAll = ensureMigratedState(parsed);
      if (migratedAll.__didMigrate) delete migratedAll.__didMigrate;
      await setWorldState(migratedAll);
      emitStateUpdated();
      this.mskState = migratedAll;
      ui.notifications.info(`${MSK.ABBR}: Imported all tabs.`);
      this.render({ force: true });
    }
  });
}
