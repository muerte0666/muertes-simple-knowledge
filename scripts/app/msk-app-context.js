import { MSK } from '../utils/constants.js';
import { SKILL_OPTIONS, SAVE_OPTIONS, decorateCheckForDisplay } from '../utils/check-display.js';

const getTextEditorImpl = () => foundry?.applications?.ux?.TextEditor?.implementation ?? Object.getOwnPropertyDescriptor(globalThis, 'TextEditor')?.value;


export async function buildAppData() {
  const isGMOriginal = game.user.isGM;
  const gmViewAsPlayer = Boolean(this._gmViewAsPlayer);
  const isGM = isGMOriginal && !gmViewAsPlayer;
  const selectedTabIsHome = this.selected.tabId === this.HOME_TAB_ID;
  const canForce = isGM;

  const tabs = this._visibleTabsForUser().slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  const selectedTab = selectedTabIsHome ? null : (tabs.find(t => t.id === this.selected.tabId) ?? null);
  const encounters = selectedTab ? this._visibleEncountersForUser(selectedTab).slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)) : [];
  const selectedEncounter = encounters.find(e => e.id === this.selected.encounterId) ?? null;
  const checks = (selectedEncounter?.checks ?? []).slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  const tabDcAdjust = selectedTab?.tabSettings?.dcAdjust ?? 0;

  const checksForTemplate = checks.map(c => decorateCheckForDisplay(c, { tabDcAdjust }));

  const showDescDefault = game.settings.get(MSK.ID, 'defaultShowDescriptionToPlayers');
  const showDesc = isGM ? true : (selectedEncounter
    ? (selectedEncounter.encounterSettings?.showDescriptionToPlayers ?? showDescDefault)
    : false);

  const description = selectedEncounter
    ? await getTextEditorImpl().enrichHTML(selectedEncounter.descriptionHtml ?? '', { async: true })
    : '';

  let encResults = null;
  if (!isGM && selectedEncounter?.results) {
    encResults = {
      criticalSuccessHtml: await getTextEditorImpl().enrichHTML(selectedEncounter.results.criticalSuccessHtml ?? '', { async: true }),
      successHtml: await getTextEditorImpl().enrichHTML(selectedEncounter.results.successHtml ?? '', { async: true }),
      failureHtml: await getTextEditorImpl().enrichHTML(selectedEncounter.results.failureHtml ?? '', { async: true }),
      criticalFailureHtml: await getTextEditorImpl().enrichHTML(selectedEncounter.results.criticalFailureHtml ?? '', { async: true }),
    };
  }

  return {
    moduleVersion: game.modules.get(MSK.ID)?.version ?? '0.0.0',
    isGM,
    isGMOriginal,
    gmViewAsPlayer,
    canForce,
    tabs,
    selectedTab,
    selectedTabIsHome,
    encounters,
    selectedEncounter,
    checks: checksForTemplate,
    skillOptions: SKILL_OPTIONS,
    saveOptions: SAVE_OPTIONS,
    encResults,
    tabDcAdjust,
    emptyTabs: tabs.length === 0,
    emptyEncounters: !!selectedTab && encounters.length === 0,
    includeDescDefault: game.settings.get(MSK.ID, 'chatCardIncludeDescriptionByDefault'),
    showDesc,
    description,
  };
}
