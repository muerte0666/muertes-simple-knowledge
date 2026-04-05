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

  // v13+: renderChatMessage is deprecated; bind to renderChatMessageHTML when available.
  const hookName = (typeof Hooks?.events === 'object' && 'renderChatMessageHTML' in Hooks.events)
    ? 'renderChatMessageHTML'
    : 'renderChatMessage';

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
