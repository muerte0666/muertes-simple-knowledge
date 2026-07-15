import { MSK } from '../utils/constants.js';
import { bindChatCardRollHandler, handleChatCardRollClick } from './chat-click-utils.js';

function htmlToElement(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  if (html?.element instanceof HTMLElement) return html.element;
  if (html?.element?.[0] instanceof HTMLElement) return html.element[0];
  return null;
}

export function registerChatHandlers() {
  if (document.body?.dataset?.mskChatRollDelegate !== '1') {
    document.body.dataset.mskChatRollDelegate = '1';
    document.body.addEventListener('click', handleChatCardRollClick, true);
  }

  // v13+ sometimes swaps out the chat log container; bind both at the log level and per-message.
  Hooks.on('renderChatLog', (_app, html) => {
    const el = htmlToElement(html);
    if (!el) return;
    if (el.dataset.mskBound === '1') return;
    el.dataset.mskBound = '1';

    bindChatCardRollHandler(el);
  });

  // v13+: renderChatMessage is deprecated in v14+; use renderChatMessageHTML when on v14+.
  // We check game.release.generation (a stable public API) rather than inspecting
  // Hooks.events, which is undocumented and may change between Foundry versions.
  const isV14Plus = Number(game.release?.generation ?? 0) >= 14;
  const hookName = isV14Plus ? 'renderChatMessageHTML' : 'renderChatMessage';

  Hooks.on(hookName, (_message, html) => {
    // Fallback click binding directly on the message node
    const el = htmlToElement(html);
    if (!el) return;
    if (el.dataset.mskBound === '1') return;
    el.dataset.mskBound = '1';

    bindChatCardRollHandler(el);
  });
}
