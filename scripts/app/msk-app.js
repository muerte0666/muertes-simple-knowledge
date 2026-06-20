import { MSK } from '../utils/constants.js';
import { getWorldState, setWorldState, ensureMigratedState } from '../utils/storage.js';
import { emitStateUpdated } from '../utils/sockets.js';
import { buildAppData } from './msk-app-context.js';
import {
  getCurrentUiSelection,
  getSelectedTab,
  getSelectedEncounter,
  getSelectedCheck,
  visibleTabsForUser,
  visibleEncountersForUser,
  applySelectionFallbacks,
} from './msk-app-state.js';
import {
  promptHtmlEditor,
  sendEncounterToChat,
  openJsonToolsDialog,
} from './msk-app-dialogs.js';
import { activateMSKAppListeners } from './msk-app-listeners.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class MSKApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.HOME_TAB_ID = '__home__';
    this.mskState = null;
    this.selected = { tabId: null, encounterId: null };
    this._commitTimeout = null;

    // Flush any pending debounced write before the page unloads so the GM
    // doesn't lose the last few keystrokes if they close the window quickly.
    this._beforeUnloadHandler = () => {
      if (this._commitTimeout !== null && this._isGMEffective() && this.mskState) {
        clearTimeout(this._commitTimeout);
        this._commitTimeout = null;
        // game.settings.set is async; fire-and-forget is the best we can do
        // inside a synchronous beforeunload callback.
        setWorldState(this.mskState).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', this._beforeUnloadHandler);
  }

  _isGMOriginal() {
    return Boolean(game.user?.isGM);
  }

  _isGMEffective() {
    return this._isGMOriginal() && !this._gmViewAsPlayer;
  }

  _requireGM(action = 'this action') {
    if (!this._isGMEffective()) {
      console.warn(`[${MSK.ABBR}] blocked non-GM: ${action}`);
      return false;
    }
    return true;
  }

  async _prepareContext(options) {
    return await this.getData(options);
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const html = $(this.element);

    try {
      const enabled = game.user?.isGM && game.settings.get(MSK.ID, 'layoutDebug');
      html.toggleClass('msk-debug', Boolean(enabled));
    } catch {
      // ignore
    }

    this.activateListeners(html);
  }

  static PARTS = {
    main: {
      template: `modules/${MSK.ID}/templates/msk-app.hbs`,
    },
  };

  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      id: 'msk-app',
      classes: ['msk-chase', 'msk-app'],
      tag: 'div',
      window: {
        title: MSK.NAME,
        resizable: true,
      },
      position: {
        width: 980,
        height: 720,
      },
    }, { inplace: false });
  }

  getCurrentUiSelection() {
    return getCurrentUiSelection.call(this);
  }

  async openForCurrentUser({ forced = false, focus = true, ui: requestedUi = null } = {}) {
    if (!game.user.isGM) {
      const allowed = game.settings.get(MSK.ID, 'playersCanOpenApp');
      if (!allowed && !forced) {
        globalThis.ui.notifications.warn(`${MSK.ABBR}: You don’t have access to open this.`);
        return;
      }
    }

    await this.reloadState();
    this._pendingStateUpdate = false;

    if (requestedUi?.tabId) this.selected.tabId = requestedUi.tabId;
    if (requestedUi?.encounterId) this.selected.encounterId = requestedUi.encounterId;

    this._applySelectionFallbacks();
    this.render({ force: true });

    if (focus) {
      setTimeout(() => {
        try {
          if (this.bringToFront) this.bringToFront();
        } catch {
          // ignore
        }
      }, 50);
    }
  }

  async reloadAndRerender() {
    const focusInfo = this._captureFocus();
    await this.reloadState();
    this._pendingStateUpdate = false;
    this._applySelectionFallbacks();
    this.render();
    this._restoreFocus(focusInfo);
  }

  async reloadState() {
    const state = await getWorldState();
    this.mskState = ensureMigratedState(state);
    delete this.mskState.__didMigrate;

    if (!this.selected.tabId) this.selected.tabId = this.mskState.uiState?.lastTabId ?? this.HOME_TAB_ID;
    if (this.selected.tabId && !this.selected.encounterId) {
      this.selected.encounterId = this.mskState.uiState?.lastEncounterIdByTab?.[this.selected.tabId] ?? null;
    }
  }

  _visibleTabsForUser() {
    return visibleTabsForUser.call(this);
  }

  _visibleEncountersForUser(tab) {
    return visibleEncountersForUser.call(this, tab);
  }

  _applySelectionFallbacks() {
    return applySelectionFallbacks.call(this);
  }

  async getData() {
    return await buildAppData.call(this);
  }

  _getSelectedTab() {
    return getSelectedTab.call(this);
  }

  _getSelectedEncounter() {
    return getSelectedEncounter.call(this);
  }

  activateListeners(html) {
    super.activateListeners?.(html);
    activateMSKAppListeners.call(this, html);
  }

  _getSelectedCheck(checkId) {
    return getSelectedCheck.call(this, checkId);
  }

  async _promptHtmlEditor(titleKey, currentHtml) {
    return await promptHtmlEditor.call(this, titleKey, currentHtml);
  }

  async _sendEncounterToChat(html) {
    return await sendEncounterToChat.call(this, html);
  }

  _captureFocus() {
    const el = document.activeElement;
    if (!el) return null;
    const tag = el.tagName?.toLowerCase();
    if (!['input', 'textarea'].includes(tag)) return null;
    const name = el.getAttribute('name');
    const selStart = el.selectionStart;
    const selEnd = el.selectionEnd;
    return { name, selStart, selEnd };
  }

  _restoreFocus(info) {
    if (!info) return;
    const root = this.element?.[0];
    if (!root) return;
    const el = root.querySelector(`[name="${CSS.escape(info.name)}"]`);
    if (!el) return;
    el.focus();
    try {
      el.setSelectionRange(info.selStart ?? 0, info.selEnd ?? 0);
    } catch {
      // ignore
    }
  }

  async _openJsonToolsDialog() {
    return await openJsonToolsDialog.call(this);
  }

  async _commitImmediate(_reason) {
    if (!this._requireGM(_reason ?? 'commit')) return;
    await setWorldState(this.mskState);
    emitStateUpdated();
  }

  _commitDebounced(_reason) {
    if (!this._requireGM(_reason ?? 'commit')) return;
    clearTimeout(this._commitTimeout);
    this._commitTimeout = setTimeout(async () => {
      await setWorldState(this.mskState);
      emitStateUpdated();
    }, 350);
  }
}
