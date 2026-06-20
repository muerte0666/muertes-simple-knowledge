# Changelog

All notable changes to Muerte's Simple Knowledge are collected here.

## 14.1.0

- Moved Home and knowledge tabs from the horizontal header row into a sidebar layout.
- Tightened tab, knowledge-entry, check-row, and tab-header sizing so long labels truncate instead of overflowing.
- Added JSON file loading to the import/export dialog.
- Added append-safe import that brings imported tab data in as new tabs without overwriting existing prep.
- Updated the Home tab highlights, README, release metadata, and staged package for the 14.1.0 release.

## 14.0.6

- Changed the optional Starfinder skill picker from Computers and Engineering to Computers and Piloting.
- Updated the Home tab, README, settings hint, manifest metadata, and release package for the 14.0.6 release.
- Added notes-folder release information and a release PDF for this build.

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

## 0.4.4

## Archive-Derived
- Modularized the app into context, dialogs, listeners, and state helper files.
- Added the GM/player regression checklist to the packaged module.
- Kept the split style stack for base, chase, app, and layout-lock styling.

## 0.4.0 - 0.4.3

## Archive-Derived
- Continued the post-0.3.x stabilization line with the chase UI, settings app, color utilities, chat commands, sockets, storage, and layout-lock styling in-package.
- Preserved Pathfinder 2e as the supported system with Foundry VTT 13 minimum and verified compatibility.

## 0.3.2.0 - 0.3.2.4

## Archive-Derived
- Added the `msk-layout-lock.css` layer to stabilize the app layout.
- Continued shipping the settings app template and color utility introduced during the 0.3.1 line.
- Kept the chat command and chase UI source layout intact across the 0.3.2 maintenance builds.

## 0.3.1 - 0.3.1.64

## Archive-Derived
- Iterated heavily on the chase UI release line.
- Added the settings app files, settings template, and shared color utility during this line.
- Retained the PF2e knowledge workflow with chat cards, roll utilities, sockets, storage, and journal launcher support.

## 0.3.0

## Archive-Derived
- Added the dedicated chat command module.
- Continued the chase-styled knowledge encounter workflow from the 0.2.x line.

## 0.2.0 - 0.2.8.2

## Archive-Derived
- Introduced the chase-styled UI release line.
- Packaged the module with app, chat, roll, settings, sockets, storage, style, and Handlebars template files.
- Included multiple maintenance and hotfix packages through the 0.2.x line.

## 0.1.0 - 0.1.1

## Archive-Derived
- Initial archived release line for Muerte's Simple Knowledge.
- Supported PF2e knowledge checks where the GM configured encounters, posted chat buttons, and players received knowledge text without revealing hidden outcome data.
## 14.1.1

## Release
- Tightened the side-tab layout and selected-tab editor header so the Adjust DC control, add button, visibility toggle, and delete button stay reachable without resizing the window.
- Reduced the tab name/title field footprint and shortened the side tab column while preserving ellipsis for long tab names.
- Refreshed release metadata and packaged the 14.1.1 Foundry install zip.
## 14.1.2

## Release
- Added a collapse/expand toggle for the Tabs list so the Knowledge entries can move higher in the sidebar.
- Strengthened the selected-tab header layout with shorter labels and hard-bounded Name, Title, and DC Adjust controls so tab actions stay reachable.
- Archived the 14.1.1 package and refreshed release metadata plus the 14.1.2 Foundry install zip.
## 14.1.3

## Release
- Shortened Knowledge sidebar labels by hiding skill/check prefixes such as "Religion:" and "Society, Performance, or Poetry Lore:" while preserving the full title in the row tooltip.
- Narrowed the whole sidebar column and compacted Knowledge rows/actions so the main Knowledge editor has more room.
- Updated all import JSON files to remove skill/check prefixes from Knowledge titles.
- Archived the 14.1.2 package and refreshed release metadata plus the 14.1.3 Foundry install zip.
## 14.1.4

## Release
- Locked the sidebar to a compact structural width so the whole left column shrinks, not just the tab/Knowledge buttons inside it.
- Changed the workspace grid to use a content-sized navigation column and give the recovered space back to the Knowledge editor.
- Tightened tab and Knowledge row stretching inside the compact sidebar so they no longer float in an oversized panel.
- Archived the 14.1.3 package and refreshed release metadata plus the 14.1.4 Foundry install zip.
## 14.1.5

## Release
- Restored Send to Chat to one public Simple Knowledge card instead of creating a duplicate private GM card.
- Kept hidden DCs on the same public card as GM-only fragments, so players still do not see them unless DC hiding is disabled.
- Kept GM result notes on the same result card as GM-only fragments instead of posting a second GM whisper card.
- Refreshed release metadata and packaged the 14.1.5 Foundry install zip.

