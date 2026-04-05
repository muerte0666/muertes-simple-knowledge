import { MSK } from './constants.js';

export function registerSocketHandlers() {
  game.socket.on(`module.${MSK.ID}`, async (payload) => {
    try {
      if (!payload || typeof payload !== 'object') return;
      const { event } = payload;
      if (event === MSK.SOCKET_EVENT_OPEN_APP) {
        await handleOpenApp(payload.data);
      } else if (event === MSK.SOCKET_EVENT_STATE_UPDATED) {
        await handleStateUpdated(payload.data);
      }
    } catch (err) {
      console.error(`[${MSK.ABBR}] socket handler error`, err);
    }
  });
}

async function handleOpenApp(data) {
  const isGM = game.user.isGM;
  if (isGM && data?.reason === 'gm-push') return; // ignore GM pushes on GM client

  if (data?.reason === 'gm-push' || data?.reason === 'chat-command') {
    const fromUser = game.users.get(data?.fromUserId);
    if (!fromUser?.isGM) return;
  }

  // Targeting
  if (data?.target === 'users' && Array.isArray(data.userIds)) {
    if (!data.userIds.includes(game.user.id)) return;
  }

  const app = game[MSK.NS]?.app;
  if (!app) return;
  await app.openForCurrentUser({
    focus: Boolean(data?.focus),
    ui: data?.ui ?? null,
    reason: data?.reason ?? 'gm-push',
    forced: true,
  });
}

async function handleStateUpdated(_data) {
  const app = game[MSK.NS]?.app;
  if (!app) return;

  // If the app is currently open, reload immediately.
  if (app.rendered) {
    await app.reloadAndRerender();
    return;
  }

  // If the app is closed, mark it so the next open starts from fresh state.
  app._pendingStateUpdate = true;
}

export function emitOpenApp({ target = 'all', userIds = [], focus = true, ui = null, reason = 'gm-push' } = {}) {
  game.socket.emit(`module.${MSK.ID}`,
    {
      event: MSK.SOCKET_EVENT_OPEN_APP,
      data: {
        v: MSK.CONTRACT_V,
        requestId: crypto.randomUUID(),
        fromUserId: game.user.id,
        target,
        userIds,
        focus,
        ui,
        reason,
      }
    }
  );
}

export function emitStateUpdated() {
  game.socket.emit(`module.${MSK.ID}`,
    {
      event: MSK.SOCKET_EVENT_STATE_UPDATED,
      data: {
        v: MSK.CONTRACT_V,
        requestId: crypto.randomUUID(),
        fromUserId: game.user.id,
        patch: { type: 'invalidate' }
      }
    }
  );
}
