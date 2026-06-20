import { MSK } from '../utils/constants.js';


import { hexToRgba } from '../utils/color.js';
export function resolveActorForUser(user) {
  // 1) assigned character
  if (user.character) return user.character;

  // 2) exactly one controlled token with owned actor
  const tokens = canvas?.tokens?.controlled ?? [];
  const owned = tokens.map(t => t.actor).filter(a => a && a.isOwner);
  if (owned.length === 1) return owned[0];

  return null;
}

function titleCase(s) {
  return String(s ?? '').replace(/\b\w/g, c => c.toUpperCase());
}

function loreSlugify(name) {
  return String(name ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getSkillLabel(chk) {
  const t = chk.skill?.type ?? 'skill';
  if (t === 'lore') {
    const name = String(chk.skill.name ?? '').trim();
    return `${name} Lore`.trim();
  }
  const slug = String(chk.skill?.slug ?? '').toLowerCase();
  if (t === 'save') {
    const saveMap = { fortitude: 'Fortitude', reflex: 'Reflex', will: 'Will' };
    return saveMap[slug] ?? titleCase(slug);
  }
  return titleCase(slug);
}

function degreeFromDelta(delta) {
  if (delta >= 10) return 'criticalSuccess';
  if (delta >= 0) return 'success';
  if (delta <= -10) return 'criticalFailure';
  return 'failure';
}

function stepDegree(deg, steps) {
  const ladder = ['criticalFailure', 'failure', 'success', 'criticalSuccess'];
  let idx = ladder.indexOf(deg);
  if (idx < 0) idx = 1;
  idx = Math.max(0, Math.min(ladder.length - 1, idx + steps));
  return ladder[idx];
}

function extractD20(roll) {
  try {
    // Find first d20 term
    const die = roll.terms.find(t => t instanceof Die && t.faces === 20);
    if (!die) return null;
    const first = die.results?.[0]?.result;
    if (typeof first !== 'number') return null;
    return first;
  } catch {
    return null;
  }
}

function resolveDefaults({ state, tab, enc, chk }) {
  const defaultRollMode = game.settings.get(MSK.ID, 'defaultRollMode');
  const defaultResp = game.settings.get(MSK.ID, 'defaultResponseVisibility');

  const rollMode = chk.checkSettings?.rollMode ?? enc.encounterSettings?.defaultRollMode ?? tab.tabSettings?.defaultRollMode ?? defaultRollMode;
  const responseVisibility = chk.checkSettings?.responseVisibility ?? enc.encounterSettings?.defaultResponseVisibility ?? tab.tabSettings?.defaultResponseVisibility ?? defaultResp;

  const hideDCWorld = game.settings.get(MSK.ID, 'hideDCFromPlayers');
  const hideDC = chk.checkSettings?.hideDCFromPlayers ?? enc.encounterSettings?.hideDCFromPlayers ?? hideDCWorld;

  return { rollMode, responseVisibility, hideDC };
}

function getRecipients(responseVisibility, rollerUserId) {
  const gmIds = game.users.filter(u => u.isGM).map(u => u.id);
  if (responseVisibility === 'public') return { whisper: [] };
  if (responseVisibility === 'gm-only') return { whisper: gmIds };
  // default: gm + roller
  const ids = Array.from(new Set([...gmIds, rollerUserId]));
  return { whisper: ids };
}

async function renderResponseCard({ header, body, gmNote = null }) {
  const _renderTemplate = foundry?.applications?.handlebars?.renderTemplate ?? globalThis.renderTemplate;
  return _renderTemplate(`modules/${MSK.ID}/templates/chat/response-card.hbs`, {
    header,
    body,
    gmNote,
    chatAccent: game.settings.get(MSK.ID, 'chatCardAccentColor'),
    chatFill: game.settings.get(MSK.ID, 'chatCardFillOpacity'),
    chatFillColor: hexToRgba(game.settings.get(MSK.ID, 'chatCardAccentColor'), game.settings.get(MSK.ID, 'chatCardFillOpacity')),
  });
}

async function getStatistic(actor, chk) {
  // Skill
  if (chk.skill?.type === 'skill') {
    const slug = chk.skill.slug;

    // PF2e perception is not a normal skill; expose separately.
    if (slug === 'perception') {
      const p = actor.perception ?? null;
      if (p?.roll) return p;
      if (p?.check?.roll) return { roll: (opts) => p.check.roll(opts) };
    }

    const stat = actor.skills?.[slug] ?? null;
    if (stat?.roll) return stat;
    // fallback to PF2e actor.getStatistic if present
    if (typeof actor.getStatistic === 'function') {
      const st = actor.getStatistic(slug);
      if (st?.check?.roll) {
        // statistic -> use st.check
        return { roll: (opts) => st.check.roll(opts) };
      }
      if (st?.roll) return st;
    }
  }


  // Save
  if (chk.skill?.type === 'save') {
    const slug = chk.skill.slug; // fortitude|reflex|will
    // PF2e actors typically expose saves at actor.saves.<slug>
    const stat = actor.saves?.[slug] ?? null;
    if (stat?.roll) return stat;
    if (stat?.check?.roll) return { roll: (opts) => stat.check.roll(opts) };

    // fallback to getStatistic if present
    if (typeof actor.getStatistic === 'function') {
      const st = actor.getStatistic(slug);
      if (st?.check?.roll) return { roll: (opts) => st.check.roll(opts) };
      if (st?.roll) return st;
    }
  }

  // Lore
  if (chk.skill?.type === 'lore') {
    const loreName = chk.skill.name ?? '';
    const loreSlug = loreSlugify(loreName);

    // PF2e commonly uses actor.skills with lore entries keyed by slug like "ruins" or "ruins-lore" depending on selector
    // Try a few common patterns.
    const candidates = [
      loreSlug,
      `${loreSlug}-lore`,
      `${loreSlug}lore`,
      `${loreSlug}-skill`,
      'lore'
    ];

    for (const key of candidates) {
      const stat = actor.skills?.[key];
      if (stat?.roll) return stat;
    }

    if (typeof actor.getStatistic === 'function') {
      // Many PF2e selectors use "<lore>-lore"
      for (const sel of [`${loreSlug}-lore`, loreSlug]) {
        const st = actor.getStatistic(sel);
        if (st?.check?.roll) return { roll: (opts) => st.check.roll(opts) };
        if (st?.roll) return st;
      }
    }

    // Log the attempted slugs so GMs can diagnose mismatches between the
    // configured lore name and the actual PF2e skill key on the actor.
    const availableLoreKeys = Object.keys(actor.skills ?? {}).filter(k =>
      k.includes('lore') || k.includes(loreSlug)
    );
    console.warn(
      `[${MSK.ABBR}] Lore skill lookup failed for "${loreName}".`,
      `Tried candidates: [${candidates.join(', ')}].`,
      `Available lore-related skill keys on actor: [${availableLoreKeys.join(', ') || 'none found'}].`,
      `All actor skill keys:`, Object.keys(actor.skills ?? {})
    );
  }

  return null;
}

export async function runKnowledgeCheck({ state, tab, enc, chk, actor, source }) {
  const { rollMode, responseVisibility, hideDC } = resolveDefaults({ state, tab, enc, chk });
  const tabAdjust = Number(tab.tabSettings?.dcAdjust ?? 0);
  const baseDC = Number(chk.dc ?? 0);
  const effectiveDC = baseDC + tabAdjust;

  const stat = await getStatistic(actor, chk);
  if (!stat || typeof stat.roll !== 'function') {
    ui.notifications.warn(`${MSK.ABBR}: Could not find a valid statistic for this check.`);
    return;
  }

  // Always use PF2e check flow and post the system check card first.
  // Post the PF2e system check card first and respect the configured roll mode.
  const postPf2eRoll = true;
  const effectiveRollMode = rollMode ?? 'blindroll';

  let roll;
  try {
    roll = await stat.roll({
      skipDialog: true,
      // Some PF2e versions use rollMode, others use blind
      rollMode: effectiveRollMode,
      blind: effectiveRollMode === 'blindroll',
      dc: { value: effectiveDC },
      createMessage: postPf2eRoll
    });
  } catch (err) {
    console.error(`[${MSK.ABBR}] roll error`, err);
    ui.notifications.error(`${MSK.ABBR}: Roll failed (see console).`);
    return;
  }

  if (!roll) {
    ui.notifications.warn(`${MSK.ABBR}: Roll canceled.`);
    return;
  }

  const total = Number(roll.total ?? 0);
  const delta = total - effectiveDC;
  let degree = degreeFromDelta(delta);

  const die = extractD20(roll);
  if (die === 20) degree = stepDegree(degree, +1);
  else if (die === 1) degree = stepDegree(degree, -1);

  const resultHtml =
    degree === 'criticalSuccess' ? enc.results?.criticalSuccessHtml :
    degree === 'success' ? enc.results?.successHtml :
    degree === 'failure' ? enc.results?.failureHtml :
    enc.results?.criticalFailureHtml;

  // GM-only notes per result degree
  const gmNoteHtml =
    degree === 'criticalSuccess' ? enc.results?.criticalSuccessGmNoteHtml :
    degree === 'success' ? enc.results?.successGmNoteHtml :
    degree === 'failure' ? enc.results?.failureGmNoteHtml :
    enc.results?.criticalFailureGmNoteHtml;

  const header = `${enc.title} — ${getSkillLabel(chk)}`;

  // Enrich result HTML
  const enriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(resultHtml ?? '', { async: true });

  const { whisper } = getRecipients(responseVisibility, game.user.id);
  const gmNote = gmNoteHtml
    ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(gmNoteHtml, { async: true })
    : null;

  // Flags for post-processing (click handlers, debugging, etc.)
  const flags = {
    encId: enc.id,
    checkId: chk.id,
    actorUuid: actor.uuid,
    rollerUserId: game.user.id,
    degree,
    total,
    dc: effectiveDC,
    dcHidden: hideDC,
    source,
  };

  const speaker = ChatMessage.getSpeaker({ actor });
  const content = await renderResponseCard({
    header,
    body: enriched,
    gmNote,
  });

  await ChatMessage.create({
    content,
    whisper,
    speaker,
    flags: { [MSK.ID]: flags },
  });
}
