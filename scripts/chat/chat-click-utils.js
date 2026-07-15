import { MSK } from '../utils/constants.js';
import { getWorldState } from '../utils/storage.js';
import { resolveActorForUser, runKnowledgeCheck } from './roll-utils.js';

function warnUnavailable() {
  ui.notifications.warn(`${MSK.ABBR}: This check isn’t available.`);
}

function resolveCheckFromState(state, { tabId, encounterId, checkId }) {
  const tab = state.tabs?.find(t => t.id === tabId);
  const enc = tab?.encounters?.find(e => e.id === encounterId);
  const chk = enc?.checks?.find(c => c.id === checkId);
  return { tab, enc, chk };
}

export async function handleChatCardRollClick(event) {
  const btn = event.target?.closest?.('.msk-roll-btn');
  if (!btn) return;

  event.preventDefault();
  event.stopPropagation();

  const v = Number(btn.dataset.mskV ?? 0);
  if (v !== MSK.CONTRACT_V) {
    ui.notifications.warn(`${MSK.ABBR}: This card is from an unsupported version.`);
    return;
  }

  const ids = {
    tabId: btn.dataset.mskTabId,
    encounterId: btn.dataset.mskEncounterId,
    checkId: btn.dataset.mskCheckId
  };

  const state = await getWorldState();
  const { tab, enc, chk } = resolveCheckFromState(state, ids);

  if (!tab || !enc || !chk) {
    warnUnavailable();
    return;
  }

  // A GM-posted chat card is an explicit invitation to roll the buttons that
  // were rendered on it. Hidden tab/encounter settings still affect the app,
  // but they should not invalidate an already-posted public card.

  const actor = resolveActorForUser(game.user);
  if (!actor) {
    ui.notifications.warn(`${MSK.ABBR}: No default character, selected owned token, or single owned character found.`);
    return;
  }

  await runKnowledgeCheck({ state, tab, enc, chk, actor, source: 'chat-card' });
}

export function bindChatCardRollHandler(element) {
  if (!element) return;
  element.addEventListener('click', handleChatCardRollClick, true);
}
