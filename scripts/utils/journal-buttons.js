import { MSK } from './constants.js';

function getRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function findJournalFooter(html) {
  // Prefer footer within the rendered HTML
  const root = getRoot(html);
  if (root?.querySelector) {
    let footer = root.querySelector('.directory-footer') ?? root.querySelector('footer');
    if (footer) return footer;

    // Some v13 directory layouts wrap content; try within directory element
    const dir = root.querySelector('.directory') ?? root;
    footer = dir?.querySelector?.('.directory-footer') ?? dir?.querySelector?.('footer');
    if (footer) return footer;
  }

  // Global fallback: Journal sidebar tab footer
  const globalFooter =
    document.querySelector('#sidebar .tab[data-tab="journal"] .directory-footer') ||
    document.querySelector('#sidebar .tab[data-tab="journal"] footer') ||
    document.querySelector('#sidebar [data-tab="journal"] .directory-footer') ||
    document.querySelector('#sidebar [data-tab="journal"] footer');

  return globalFooter || null;
}

function ensureFooter(root) {
  // Create a footer if none exists
  const dir = root?.querySelector?.('.directory') ?? root;
  if (!dir) return null;
  const footer = document.createElement('footer');
  footer.classList.add('directory-footer');
  dir.appendChild(footer);
  return footer;
}

export function injectJournalButtons(html) {
  try {
    const canPlayersOpen = game.settings.get(MSK.ID, 'playersCanOpenApp');
    const root = getRoot(html);
    let footer = findJournalFooter(html);
    if (!footer && root?.querySelector) footer = ensureFooter(root);
    if (!footer) return;

    // prevent duplicates
    if (footer.querySelector('.msk-open-log')) return;

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'msk-open-log';
    open.innerHTML = `<i class="fas fa-book-open"></i> ${MSK.NAME}`;

    if (game.user.isGM) {
      open.addEventListener('click', (event) => {
        event.preventDefault();
        game[MSK.NS]?.openApp?.({});
      });
    } else if (canPlayersOpen) {
      open.addEventListener('click', (event) => {
        event.preventDefault();
        game[MSK.NS]?.openApp?.({ forced: false });
      });
    } else {
      open.disabled = true;
      open.title = 'MSK: The GM has disabled players opening this app.';
    }

    footer.appendChild(open);
  } catch (err) {
    console.error(`[${MSK.ABBR}] injectJournalButtons error`, err);
  }
}
