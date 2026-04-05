export const SKILL_OPTIONS = [
  { slug: 'perception', label: 'Perception' },
  { slug: 'acrobatics', label: 'Acrobatics' },
  { slug: 'arcana', label: 'Arcana' },
  { slug: 'athletics', label: 'Athletics' },
  { slug: 'crafting', label: 'Crafting' },
  { slug: 'deception', label: 'Deception' },
  { slug: 'diplomacy', label: 'Diplomacy' },
  { slug: 'intimidation', label: 'Intimidation' },
  { slug: 'medicine', label: 'Medicine' },
  { slug: 'nature', label: 'Nature' },
  { slug: 'occultism', label: 'Occultism' },
  { slug: 'performance', label: 'Performance' },
  { slug: 'religion', label: 'Religion' },
  { slug: 'society', label: 'Society' },
  { slug: 'stealth', label: 'Stealth' },
  { slug: 'survival', label: 'Survival' },
  { slug: 'thievery', label: 'Thievery' },
];

export const SAVE_OPTIONS = [
  { slug: 'fortitude', label: 'Fortitude' },
  { slug: 'reflex', label: 'Reflex' },
  { slug: 'will', label: 'Will' },
];

const SKILL_LABELS = new Map(SKILL_OPTIONS.map(option => [option.slug, option.label]));
const SAVE_LABELS = new Map(SAVE_OPTIONS.map(option => [option.slug, option.label]));

function startCaseSlug(value) {
  const text = String(value ?? '').trim().replace(/[-_]+/g, ' ');
  if (!text) return '';
  return text.replace(/\b\w/g, (match) => match.toUpperCase());
}

export function formatCheckTypeLabel(check) {
  const skill = check?.skill ?? {};
  const type = skill.type;
  const slug = String(skill.slug ?? '').trim().toLowerCase();

  if (type === 'skill') return SKILL_LABELS.get(slug) ?? startCaseSlug(slug);
  if (type === 'save') return SAVE_LABELS.get(slug) ?? startCaseSlug(slug);
  if (type === 'lore') {
    const loreName = String(skill.name ?? '').trim();
    if (!loreName) return 'Lore';
    return /\blore$/i.test(loreName) ? loreName : `${loreName} Lore`;
  }

  return startCaseSlug(check?.label ?? '');
}

export function buildEncounterChatButtons(checks = [], { tabDcAdjust = 0, showDC = () => true } = {}) {
  return checks.map((check) => ({
    id: check.id,
    label: formatCheckTypeLabel(check),
    dc: Number(check?.dc ?? 0) + Number(tabDcAdjust ?? 0),
    showDC: Boolean(showDC(check)),
  }));
}

export function decorateCheckForDisplay(check, { tabDcAdjust = 0 } = {}) {
  return {
    ...check,
    effectiveDc: Number(check?.dc ?? 0) + Number(tabDcAdjust ?? 0),
    checkTypeLabel: formatCheckTypeLabel(check),
    skillLabel: check?.skill?.type === 'skill' ? formatCheckTypeLabel(check) : null,
    saveLabel: check?.skill?.type === 'save' ? formatCheckTypeLabel(check) : null,
  };
}
