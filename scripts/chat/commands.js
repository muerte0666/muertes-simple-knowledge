import { MSK } from '../utils/constants.js';
import { emitOpenApp } from '../utils/sockets.js';

/**
 * Chat commands:
 *  !msk          -> open app for current user
 *  !msk push     -> GM: force-open app for all players
 *  !msk help     -> show help
 */
export function registerMSKChatCommands() {
  Hooks.on('chatMessage', (_chatLog, message, _data) => {
    const msg = String(message ?? '').trim();
    if (!msg.toLowerCase().startsWith('!msk')) return;

    const parts = msg.split(/\s+/).slice(1);
    const sub = (parts[0] ?? '').toLowerCase();

    if (sub === 'help') {
      ui.notifications.info('MSK commands: !msk (open), !msk push (GM open for all players), !msk help');
      return false;
    }

    if (sub === 'push') {
      if (!game.user.isGM) {
        ui.notifications.warn('MSK: GM only.');
        return false;
      }
      emitOpenApp({ target: 'all', focus: true, ui: null, reason: 'chat-command' });
      return false;
    }

    // default: open for current user
    game[MSK.NS]?.openApp?.({});
    return false;
  });
}
