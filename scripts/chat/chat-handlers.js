import { MSK } from '../utils/constants.js';
import { bindChatCardRollHandler } from './chat-click-utils.js';

export function registerChatHandlers() {
  // v13+ sometimes swaps out the chat log container; bind both at the log level and per-message.
  Hooks.on('renderChatLog', (_app, html) => {
    const el = html[0];
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
    const el = (hookName === 'renderChatMessageHTML')
      ? html
      : html?.[0];
    if (!el) return;
    if (el.dataset.mskBound === '1') return;
    el.dataset.mskBound = '1';

    bindChatCardRollHandler(el);
  });
}
