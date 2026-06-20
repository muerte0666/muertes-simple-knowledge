import { MSK } from './constants.js';
export function registerSettings() {
  game.settings.register(MSK.ID, 'worldState', {
    name: 'MSK World State',
    hint: 'Internal data store for Muerte\'s Simple Knowledge.',
    scope: 'world',
    config: false,
    type: Object,
    default: null,
  });

  // Note: Settings are registered directly into Foundry's Module Settings list (no "Configure" submenu).
  const version = game.modules.get(MSK.ID)?.version ?? '';

  // Access & Permissions
  game.settings.register(MSK.ID, 'playersCanOpenApp', {
    name: `${MSK.NAME} (v${version}) — Access: Players can open app`,
    hint: 'If enabled, players get a button at the bottom of the Journal tab to open the MSK app.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MSK.ID, 'hideDCFromPlayers', {
    name: 'Access: Hide DC from players',
    hint: 'Players never see DCs in MSK.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  // Defaults
  game.settings.register(MSK.ID, 'defaultRollMode', {
    name: 'Defaults: Roll Mode',
    hint: 'Default roll privacy used when MSK triggers PF2e/SF2e checks.',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      publicroll: 'Public',
      gmroll: 'GM (Private)',
      blindroll: 'Blind GM (Secret)',
      selfroll: 'Self',
    },
    default: 'blindroll',
  });

  game.settings.register(MSK.ID, 'defaultResponseVisibility', {
    name: 'Defaults: Result Visibility',
    hint: 'Who receives the MSK result message.',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      public: 'Public',
      'whisper-gm-and-roller': 'Whisper GM + Roller',
      'gm-only': 'GM Only',
    },
    default: 'whisper-gm-and-roller',
  });

  game.settings.register(MSK.ID, 'defaultShowDescriptionToPlayers', {
    name: 'Defaults: Show descriptions to players',
    hint: 'Default for new Knowledge entries; can be overridden per entry.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MSK.ID, 'chatCardIncludeDescriptionByDefault', {
    name: 'Defaults: Include description on chat cards',
    hint: 'Default behavior when GM posts a Knowledge card to chat.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MSK.ID, 'includeStarfinderSkills', {
    name: 'Rules: Include Starfinder 2e skills',
    hint: 'Adds Computers and Piloting to the skill choices. Enabled by default in Starfinder 2e worlds.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: game.system?.id === 'sf2e',
    onChange: () => game[MSK.NS]?.app?.render?.(false),
  });

  game.settings.register(MSK.ID, 'blockRollIfTabHidden', {
    name: 'Access: Block rolls if tab is hidden',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MSK.ID, 'blockRollIfEncounterHidden', {
    name: 'Access: Block rolls when Knowledge hidden',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  // Chat card appearance
  game.settings.register(MSK.ID, 'chatCardAccentColor', {
    name: 'Chat Card: Accent Color',
    hint: 'Border/glow color used on MSK chat cards (Knowledge cards and result cards).',
    scope: 'world',
    config: true,
    type: String,
    default: '#FF7A00',
  });

  game.settings.register(MSK.ID, 'chatCardFillOpacity', {
    name: 'Chat Card: Fill Opacity',
    hint: 'Background fill opacity for MSK chat cards (0.0–1.0).',
    scope: 'world',
    config: true,
    type: Number,
    range: { min: 0, max: 1, step: 0.05 },
    default: 0.60,
  });

  // Debug
  game.settings.register(MSK.ID, 'layoutDebug', {
    name: 'Debug: Layout outlines (GM)',
    hint: 'Draw dashed outlines on key MSK layout regions to diagnose overflow/spacing issues.',
    scope: 'client',
    config: true,
    restricted: true,
    type: Boolean,
    default: false,
  });
}
