import { MSK } from './constants.js';


const CURRENT_SCHEMA_VERSION = 2;
function defaultState() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    uiState: {
      lastTabId: null,
      lastEncounterIdByTab: {},
      tabsCollapsed: false,
    },
    settings: {
      // mirrored for portability; actual live values come from game.settings
      defaultRollMode: 'blindroll',
      defaultResponseVisibility: 'whisper-gm-and-roller',
      hideDCFromPlayers: true,
      defaultShowDescriptionToPlayers: true,
    },
    tabs: [],
  };
}

export async function getWorldState() {
  const stored = game.settings.get(MSK.ID, 'worldState');
  const migrated = ensureMigratedState(stored ?? defaultState());
  if (migrated.__didMigrate) {
    delete migrated.__didMigrate;
    // Persist migration so future loads don't repeat work
    await game.settings.set(MSK.ID, 'worldState', migrated);
  }
  return migrated;
}

export async function setWorldState(state) {
  const migrated = ensureMigratedState(state ?? defaultState());
  if (migrated.__didMigrate) delete migrated.__didMigrate;
  await game.settings.set(MSK.ID, 'worldState', migrated);
}

export function ensureMigratedState(state) {
  const s = foundry.utils.deepClone(state ?? defaultState());
  let did = false;

  if (!s.schemaVersion || Number(s.schemaVersion) < CURRENT_SCHEMA_VERSION) {
    s.schemaVersion = CURRENT_SCHEMA_VERSION;
    did = true;
  }

  if (!s.uiState) {
    s.uiState = { lastTabId: null, lastEncounterIdByTab: {}, tabsCollapsed: false };
    did = true;
  }
  if (!s.uiState.lastEncounterIdByTab) {
    s.uiState.lastEncounterIdByTab = {};
    did = true;
  }
  if (typeof s.uiState.tabsCollapsed !== 'boolean') {
    s.uiState.tabsCollapsed = false;
    did = true;
  }

  if (!Array.isArray(s.tabs)) {
    s.tabs = [];
    did = true;
  }

  for (const tab of s.tabs) {
    // Optional longer display title (distinct from short tab key/name)
    if (typeof tab.title !== 'string') { tab.title = ''; did = true; }
    tab.tabSettings ??= {};
    if (typeof tab.tabSettings.showToPlayers !== 'boolean') { tab.tabSettings.showToPlayers = false; did = true; }
    if (typeof tab.tabSettings.dcAdjust !== 'number') { tab.tabSettings.dcAdjust = 0; did = true; }
    tab.tabSettings.defaultRollMode ??= null;
    tab.tabSettings.defaultResponseVisibility ??= null;
    if (!Array.isArray(tab.encounters)) { tab.encounters = []; did = true; }

    for (const enc of tab.encounters) {
      enc.encounterSettings ??= {};
      if (typeof enc.encounterSettings.showToPlayers !== 'boolean') { enc.encounterSettings.showToPlayers = false; did = true; }
      enc.encounterSettings.showDescriptionToPlayers ??= null;
      enc.encounterSettings.hideDCFromPlayers ??= null;
      enc.encounterSettings.defaultRollMode ??= null;
      enc.encounterSettings.defaultResponseVisibility ??= null;
      enc.descriptionHtml ??= '';
      enc.results ??= {
        criticalSuccessHtml: '',
        successHtml: '',
        failureHtml: '',
        criticalFailureHtml: '',
        // GM-only notes per outcome (used in chat result cards)
        criticalSuccessGmNoteHtml: '',
        successGmNoteHtml: '',
        failureGmNoteHtml: '',
        criticalFailureGmNoteHtml: '',
        // legacy
        gmOnlyNotesHtml: '',
      };
      enc.results.criticalSuccessGmNoteHtml ??= '';
      enc.results.successGmNoteHtml ??= '';
      enc.results.failureGmNoteHtml ??= '';
      enc.results.criticalFailureGmNoteHtml ??= '';
      if (!Array.isArray(enc.checks)) { enc.checks = []; did = true; }

      for (const chk of enc.checks) {
        chk.checkSettings ??= {};
        if (typeof chk.checkSettings.showToPlayers !== 'boolean') { chk.checkSettings.showToPlayers = true; did = true; }
        chk.checkSettings.rollMode ??= null;
        chk.checkSettings.responseVisibility ??= null;
        chk.checkSettings.hideDCFromPlayers ??= null;
        chk.results ??= {};
        chk.results.criticalSuccessHtml ??= '';
        chk.results.successHtml ??= '';
        chk.results.failureHtml ??= '';
        chk.results.criticalFailureHtml ??= '';
        chk.results.gmOnlyNotesHtml ??= '';
      }
    }
  }

  if (did) s.__didMigrate = true;
  return s;
}

export function makeId(prefix = 'id') {
  // short random id
  const rand = crypto.randomUUID().split('-')[0];
  return `${prefix}_${rand}`;
}

export function nextSort(list) {
  const max = Math.max(0, ...list.map(e => Number(e.sort) || 0));
  return max + 100;
}

export function newTabTemplate() {
  return {
    id: makeId('tab'),
    name: 'New Tab',
    title: '',
    sort: 100,
    tabSettings: {
      showToPlayers: false,
      defaultRollMode: null,
      defaultResponseVisibility: null,
      dcAdjust: 0,
    },
    encounters: [],
  };
}

export function newEncounterTemplate() {
  return {
    id: makeId('enc'),
    title: 'New Encounter',
    descriptionHtml: '',
    sort: 100,
    encounterSettings: {
      showToPlayers: false,
      showDescriptionToPlayers: null,
      hideDCFromPlayers: null,
      defaultRollMode: null,
      defaultResponseVisibility: null,
    },
    checks: [],
    results: {
      criticalSuccessHtml: '',
      successHtml: '',
      failureHtml: '',
      criticalFailureHtml: '',
      criticalSuccessGmNoteHtml: '',
      successGmNoteHtml: '',
      failureGmNoteHtml: '',
      criticalFailureGmNoteHtml: '',
      gmOnlyNotesHtml: '',
    },
  };
}

export function newCheckTemplate() {
  return {
    id: makeId('chk'),
    label: 'Recall Knowledge',
    skill: { type: 'skill', slug: 'society' },
    dc: 15,
    sort: 100,
    checkSettings: {
      showToPlayers: true,
      rollMode: null,
      responseVisibility: null,
      hideDCFromPlayers: null,
    },
    results: {
      criticalSuccessHtml: '',
      successHtml: '',
      failureHtml: '',
      criticalFailureHtml: '',
      criticalSuccessGmNoteHtml: '',
      successGmNoteHtml: '',
      failureGmNoteHtml: '',
      criticalFailureGmNoteHtml: '',
      gmOnlyNotesHtml: '',
    },
  };
}
