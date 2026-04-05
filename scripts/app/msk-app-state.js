export function getCurrentUiSelection() {
  return {
    tabId: this.selected.tabId,
    encounterId: this.selected.encounterId,
  };
}

export function getSelectedTab() {
  if (this.selected.tabId === this.HOME_TAB_ID) return null;
  const tabs = this.mskState?.tabs ?? [];
  return tabs.find(t => t.id === this.selected.tabId) ?? null;
}

export function getSelectedEncounter() {
  const tab = this._getSelectedTab();
  if (!tab) return null;
  const encs = tab.encounters ?? [];
  return encs.find(e => e.id === this.selected.encounterId) ?? null;
}

export function getSelectedCheck(checkId) {
  const enc = this._getSelectedEncounter();
  return enc?.checks?.find(c => c.id === checkId) ?? null;
}

export function visibleTabsForUser() {
  const tabs = this.mskState?.tabs ?? [];
  if (this._isGMEffective()) return tabs;
  return tabs.filter(t => t.tabSettings?.showToPlayers);
}

export function visibleEncountersForUser(tab) {
  const encs = tab?.encounters ?? [];
  if (this._isGMEffective()) return encs;
  return encs.filter(e => e.encounterSettings?.showToPlayers);
}

export function applySelectionFallbacks() {
  if (!this.mskState?.uiState) this.mskState.uiState = { lastTabId: this.HOME_TAB_ID, lastEncounterIdByTab: {} };
  if (!this.mskState.uiState.lastEncounterIdByTab) this.mskState.uiState.lastEncounterIdByTab = {};

  if (this.selected.tabId === this.HOME_TAB_ID) {
    this.selected.encounterId = null;
    this.mskState.uiState.lastTabId = this.HOME_TAB_ID;
    return;
  }

  const tabs = this._visibleTabsForUser().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  if (!tabs.length) {
    this.selected.tabId = this.HOME_TAB_ID;
    this.selected.encounterId = null;
    this.mskState.uiState.lastTabId = this.HOME_TAB_ID;
    return;
  }

  let tab = tabs.find(t => t.id === this.selected.tabId);
  if (!tab) tab = tabs[0];
  this.selected.tabId = tab.id;

  const encs = this._visibleEncountersForUser(tab).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  if (!encs.length) {
    this.selected.encounterId = null;
    return;
  }

  let enc = encs.find(e => e.id === this.selected.encounterId);
  if (!enc) enc = encs[0];
  this.selected.encounterId = enc.id;

  this.mskState.uiState.lastTabId = this.selected.tabId;
  this.mskState.uiState.lastEncounterIdByTab[this.selected.tabId] = this.selected.encounterId;
}
