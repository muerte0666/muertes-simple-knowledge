import { MSK } from './utils/constants.js';
import { registerSettings } from './utils/settings.js';
import { getWorldState, setWorldState, ensureMigratedState } from './utils/storage.js';
import { MSKApp } from './app/msk-app.js';
import { registerSocketHandlers, emitStateUpdated, emitOpenApp } from './utils/sockets.js';
import { registerChatHandlers } from './chat/chat-handlers.js';
import { registerMSKChatCommands } from './chat/commands.js';
import { injectJournalButtons } from './utils/journal-buttons.js';

Hooks.once('init', () => {
  registerSettings();

  // Handlebars helpers used by templates
  Handlebars.registerHelper('eq', (a, b) => a === b);
  Handlebars.registerHelper('ne', (a, b) => a !== b);
  Handlebars.registerHelper('add', (a, b) => Number(a ?? 0) + Number(b ?? 0));
  Handlebars.registerHelper('or', (...args) => args.slice(0, -1).some(Boolean));
});

Hooks.once('ready', async () => {
  registerSocketHandlers();
  registerChatHandlers();
  registerMSKChatCommands();
  document.body?.classList?.toggle('msk-user-is-gm', Boolean(game.user?.isGM));
  // Ensure state exists (and auto-migrates/persists)
  await getWorldState();

  // Store singleton app on game for easy access
  if (!game[MSK.NS]) game[MSK.NS] = {};
  game[MSK.NS].app = new MSKApp();
  game[MSK.NS].openApp = async (opts = {}) => {
    const app = game[MSK.NS].app;
    await app.openForCurrentUser(opts);
  };
  game[MSK.NS].openForAllPlayers = async (opts = {}) => {
    if (!game.user.isGM) return;
    emitOpenApp({ target: 'all', focus: true, ui: opts.ui ?? null, reason: 'gm-push' });
  };
});

// Journal directory button injection
Hooks.on('renderJournalDirectory', (app, html) => {
  injectJournalButtons(html);
});


// Journal/Sidebar button injection (v13-safe)
Hooks.on('renderJournalEntryDirectory', (app, html) => {
  injectJournalButtons(html);
});

Hooks.on('renderSidebarTab', (app, html) => {
  try {
    // Foundry v13 journal sidebar tab
    const tabName = app?.options?.id ?? app?.tabName ?? app?.id;
    if (tabName === 'journal' || tabName === 'journal-directory' || tabName === 'journalEntryDirectory') {
      injectJournalButtons(html);
      return;
    }
    // Some builds expose the directory class name instead
    if (app?.constructor?.name?.toLowerCase?.().includes('journal')) {
      injectJournalButtons(html);
    }
  } catch (err) {
    console.warn('[MSK] renderSidebarTab injection failed', err);
  }
});
