# Aurora Feint Browser Remake

This is a standalone browser remake prototype of `Aurora Feint: The Beginning`, using the extracted iOS 1.0.0.1 assets already present in this workspace.

## Play

Open:

```text
web/index.html
```

The remake is static HTML/CSS/JS, so no build step is required.

## Asset Conversion

The original iPhone PNGs use Apple's CgBI PNG optimization, which ordinary browser decoders reject. Converted browser-ready copies live in `web/assets`.

To regenerate them:

```text
node tools/convert-ios-pngs.cjs
```

## Checks

```text
node --check web/game.js
node tools/test-board-matching.cjs
```

## Current Scope

- Original map, character portraits, mine/smith/tower backgrounds, block sprites, and UI images are wired in.
- Mine mode uses Panel de Pon-style horizontal/vertical swapping, rising rows, animated directional gravity, tilt controls, chain combos, resources, crystals, level progression, and tool blocks after crafting.
- Store, Smith, and Tower screens provide a working resource loop with blueprints, timed crafting challenges, magicbook puzzles, and mastery gains.
