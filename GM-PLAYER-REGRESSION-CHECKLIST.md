# GM vs Player Regression Checklist

Use this before release or after any visibility, chat, or app-flow changes.

## Setup
- Create at least 2 tabs.
- Create at least 2 encounters in one tab.
- Add at least 3 checks to one encounter.
- Mark one encounter hidden from players.
- Mark one check hidden from players.
- Add GM-only notes to at least one result path.
- Test once as GM and once as a player user.

## App Visibility
- GM can see all tabs, encounters, and checks.
- Player cannot see hidden tabs.
- Player cannot see hidden encounters.
- Player cannot see checks marked hidden from players.
- Home tab opens normally for both GM and player.

## App Interaction
- GM can create, edit, delete, and reorder content normally.
- Player can only interact with player-visible roll actions.
- Player cannot trigger a hidden check from the app.
- If the GM opens the app for players, the player lands on an allowed view.
- If the last viewed tab or encounter is now hidden, the player falls back safely instead of landing in a broken state.

## Chat Card Behavior
- Send to Chat includes only player-visible checks.
- Hidden checks are not posted on the public encounter card.
- If all checks are hidden, Send to Chat warns correctly instead of posting a misleading card.
- Player cannot trigger a hidden check from a chat card.
- GM can still see the full internal state in the app after posting to chat.

## Results and Notes
- Player-facing result text shows correctly on success and failure.
- GM-only notes remain hidden from players.
- GM receives GM-only notes even when the roll is triggered by a player.
- DC display matches the intended visibility rules on the posted card.
- Threshold or result adjustments still save and reopen correctly.

## Dialogs and Safety Checks
- Delete actions use DialogV2 and complete the deletion after confirmation.
- Import/replace actions use DialogV2 and only replace after confirmation.
- Prompt/edit flows use DialogV2 and save correctly.
- Canceling a dialog leaves state unchanged.

## Final Pass
- Reload the world and confirm the same tab, encounter, and check state persists.
- Reopen as GM and player and confirm visibility rules still hold.
- Confirm there are no console errors during app open, chat posting, or roll resolution.
