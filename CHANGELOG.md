# Changelog

All notable changes to Muerte's Simple Knowledge are collected here.

## 14.0.5

- Expanded the Home tab highlights to cover the current Pathfinder 2e and Starfinder 2e feature set.
- Updated the package README/splash highlights to match the in-app Home tab.
- Removed the older "Built for live sessions..." fine-print line from the Home tab.
- Refreshed release metadata and package zip for Foundry installation.

## 14.0.4

- Added Starfinder 2e (`sf2e`) as a supported Foundry system alongside Pathfinder 2e.
- Added a world setting, **Rules: Include Starfinder 2e skills**, which adds Computers and Engineering to the skill picker.
- The Starfinder skill setting defaults on in `sf2e` worlds and stays user-controlled in `pf2e` worlds.
- Skill labels now prefer the running system's configured skill labels when available, with built-in fallback labels for Computers and Engineering.
- Updated module copy and release metadata for Pathfinder 2e / Starfinder 2e support.

## 14.0.3

- Version bump to 14.0.3
- GitHub release metadata refreshed for Foundry installation
- The Home tab now keeps the splash and module information visible below the empty-tabs message.
- The empty-tabs message keeps its own bordered callout so it stays visually distinct from the Home splash.

## 14.0.2

## Bug Fixes

- **[msk-app-listeners.js]** Added missing GM guard to `edit-encounter-result` listener. Previously a non-GM user could mutate the in-memory encounter result state (the actual world-state write was already blocked by `_requireGM`, but the local object was still modified).

- **[msk-app.js]** Added `beforeunload` handler to flush any pending debounced commit before the page unloads. Previously, if the GM closed the browser window within 350ms of typing in a tab name, encounter title, check description, or result field, the change could be lost.

- **[roll-utils.js]** Improved Lore skill lookup failure diagnostics. When a lore check cannot be resolved to an actor statistic, the console now logs the attempted candidate slugs and all available lore-related skill keys on the actor, making it much easier to diagnose mismatches between the configured lore name and the PF2e skill key.

- **[chat-handlers.js]** Replaced undocumented `Hooks.events` inspection with a stable `game.release.generation` version check to select between `renderChatMessageHTML` (V14+) and `renderChatMessage` (V13). Functionally identical but more resilient to future Foundry changes.

## 14.0.1

- Version bump to 14.0.1
- Foundry compatibility verified for version 14 while retaining minimum support for version 13
- GitHub release metadata refreshed for Foundry installation

## 1.0.0

- First stable GitHub-ready release package for this module line.
- Prepared Foundry install metadata for direct manifest-based installation.

## Included
- Existing 0.5.8 fixes are included in this release.
- `module.json` updated to `1.0.0`
- GitHub `url`, `manifest`, and `download` fields added for release publishing.

## 0.5.8

## Fixed
- Tab Adjust DC now applies when the number is changed, without needing a confirm button.
- Encounter chat cards now send a GM-visible version with DCs when player-facing cards hide them.

## Version
- `module.json` -> `0.5.8`

## 0.5.7

## Fixed
- Registered the missing `or` Handlebars helper used by the checks view template.
- Stopped shipping hidden DC values in player-facing encounter chat cards.
- Preserved GM-only notes by sending a GM-visible result card when players trigger knowledge rolls.

## Version
- `module.json` -> `0.5.7`

## 0.5.6

## Fixed
- Removed the extra top margin on the Journal sidebar launcher so its spacing matches the Quest Tracker button more closely.

## Version
- `module.json` -> `0.5.6`

## 0.5.5

## Updated
- Created By home pills now rest in bright orange and shift to blue on hover/focus to match the newer Encounters and Quest Tracker button treatment.
- The Journal sidebar launcher now uses the same orange-at-rest and blue-on-hover/focus behavior.

## Version
- `module.json` -> `0.5.5`

## 0.5.4

## Updated
- Module author metadata now displays `Muerte` instead of `muerte black`.

## Version
- `module.json` -> `0.5.4`

## 0.5.3

## Updated
- Replaced the module's bright yellow accent framing with a bright orange accent across shared MSK border/glow styling.
- Updated the default chat-card accent color to bright orange so new encounter and result cards match the refreshed module framing.

## Version
- `module.json` -> `0.5.3`

## 0.5.2

## Fixed
- GM-only `(DC #)` text on encounter chat cards now stays visible for GMs.
- MSK now applies its own client-side GM body class before resolving chat-card GM-only visibility, instead of relying on Foundry theme/body classes that may not exist.

## Version
- `module.json` -> `0.5.2`

## 0.5.1

## Updated
- Journal sidebar button now uses the same single-button footer pattern and visual treatment as Muerte's Quest Tracker.
- MSK journal button injection keeps the current GM/player access rules while matching the Quest Tracker family styling more closely.

## Version
- `module.json` -> `0.5.1`

## 0.5.0

## Updated
- First Codex-managed release package for MSK.
- Forced app-open socket events now validate that the sender is a GM before honoring the request.
- Knowledge checks now respect the configured MSK roll mode instead of always forcing blind rolls.

## Packaging
- `module.json` version bumped to `0.5.0`
- Full release zip prepared for direct Foundry import

## 0.4.7

## Added
- Small shared chat-card click helper layer for roll-button binding, state lookup, access validation, and execution.
- New shared utility file: `scripts/chat/chat-click-utils.js`

## Updated
- `scripts/chat/chat-handlers.js` now binds through a shared handler instead of duplicating the same click validation in two hook branches.
- Chat-card version validation, tab/encounter/check lookup, per-check visibility enforcement, actor resolution, and roll execution now run through one shared path.

## Version
- `module.json` -> `0.4.7`

## 0.4.6

## Added
- Small shared helper layer for check label formatting and encounter chat-card button building.
- New shared utility file: `scripts/utils/check-display.js`

## Updated
- App check rows now use the shared formatted check label instead of inline skill/save/lore branching.
- Encounter chat-card buttons now use the same shared label formatter as the app.
- Centralized effective DC decoration for display prep.

## Version
- `module.json` -> `0.4.6`
- `scripts/init.js` load log -> `v0.4.6`

## 0.4.5

## Release Polish
- Removed startup console noise and the hardcoded template hash log
- Removed unused custom settings-app files that were not wired into this build
- Cleaned manifest metadata by dropping blank release URL fields
- Cleaned an over-specific journal footer button selector
- Kept the GM/player regression checklist in-package for release testing

## Version
- `module.json` updated to `0.4.5`
