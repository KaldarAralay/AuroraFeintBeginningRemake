#!/usr/bin/env node

const COLS = 6;
const GRAVITY = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};
const specialTypes = new Set(["compass", "watch", "potion", "coal", "hammer2", "hammer3"]);

function cell(type) {
  return { type };
}

function matchType(value) {
  if (!value || specialTypes.has(value.type)) return null;
  return value.type;
}

function findMatches(grid) {
  const matched = new Set();

  for (let r = 0; r < grid.length; r += 1) {
    let runType = null;
    let runStart = 0;
    let runLength = 0;
    for (let c = 0; c <= COLS; c += 1) {
      const type = c < COLS ? matchType(grid[r][c]) : null;
      if (type && type === runType) {
        runLength += 1;
      } else {
        if (runType && runLength >= 3) {
          for (let x = runStart; x < runStart + runLength; x += 1) matched.add(`${r},${x}`);
        }
        runType = type;
        runStart = c;
        runLength = type ? 1 : 0;
      }
    }
  }

  for (let c = 0; c < COLS; c += 1) {
    let runType = null;
    let runStart = 0;
    let runLength = 0;
    for (let r = 0; r <= grid.length; r += 1) {
      const type = r < grid.length ? matchType(grid[r][c]) : null;
      if (type && type === runType) {
        runLength += 1;
      } else {
        if (runType && runLength >= 3) {
          for (let y = runStart; y < runStart + runLength; y += 1) matched.add(`${y},${c}`);
        }
        runType = type;
        runStart = r;
        runLength = type ? 1 : 0;
      }
    }
  }

  return matched;
}

function canSwap(grid, a, b, gravity, mode = "mine") {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  if (dr + dc !== 1) return false;
  if (mode === "puzzle") return true;
  return gravity.col === 0 ? dc === 1 : dr === 1;
}

function swap(grid, a, b, gravity = GRAVITY.down, mode = "mine") {
  if (!canSwap(grid, a, b, gravity, mode)) return false;
  const first = grid[a.row][a.col];
  grid[a.row][a.col] = grid[b.row][b.col];
  grid[b.row][b.col] = first;
  return true;
}

function ascendingIndexes(length) {
  return Array.from({ length }, (_, index) => index);
}

function descendingIndexes(length) {
  return Array.from({ length }, (_, index) => length - 1 - index);
}

function applyGravity(grid, gravity) {
  let moved = false;

  if (gravity.col === 0) {
    const rows = gravity.row > 0 ? descendingIndexes(grid.length) : ascendingIndexes(grid.length);
    for (let c = 0; c < COLS; c += 1) {
      const stack = rows.map((r) => grid[r][c]).filter(Boolean);
      for (let i = 0; i < rows.length; i += 1) {
        const r = rows[i];
        const next = stack[i] || null;
        if (grid[r][c] !== next) moved = true;
        grid[r][c] = next;
      }
    }
  } else {
    const cols = gravity.col > 0 ? descendingIndexes(COLS) : ascendingIndexes(COLS);
    for (let r = 0; r < grid.length; r += 1) {
      const stack = cols.map((c) => grid[r][c]).filter(Boolean);
      for (let i = 0; i < cols.length; i += 1) {
        const c = cols[i];
        const next = stack[i] || null;
        if (grid[r][c] !== next) moved = true;
        grid[r][c] = next;
      }
    }
  }

  return moved;
}

function isBoardStable(grid, gravity) {
  if (gravity.col === 0) {
    const rows = gravity.row > 0 ? descendingIndexes(grid.length) : ascendingIndexes(grid.length);
    for (let c = 0; c < COLS; c += 1) {
      let foundGap = false;
      for (const r of rows) {
        const hasCell = Boolean(grid[r][c]);
        if (!hasCell) foundGap = true;
        else if (foundGap) return false;
      }
    }
  } else {
    const cols = gravity.col > 0 ? descendingIndexes(COLS) : ascendingIndexes(COLS);
    for (let r = 0; r < grid.length; r += 1) {
      let foundGap = false;
      for (const c of cols) {
        const hasCell = Boolean(grid[r][c]);
        if (!hasCell) foundGap = true;
        else if (foundGap) return false;
      }
    }
  }

  return true;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const horizontal = Array.from({ length: 8 }, () => Array(COLS).fill(null));
  horizontal[4][1] = cell("fire");
  horizontal[4][2] = cell("fire");
  horizontal[4][3] = cell("fire");
  assert(findMatches(horizontal).size === 3, "horizontal match should register");

  const vertical = Array.from({ length: 8 }, () => Array(COLS).fill(null));
  vertical[2][5] = cell("wind");
  vertical[3][5] = cell("wind");
  vertical[4][5] = cell("wind");
  assert(findMatches(vertical).size === 3, "vertical match should register");

  const swapped = Array.from({ length: 8 }, () => Array(COLS).fill(null));
  swapped[3][2] = cell("water");
  swapped[4][2] = cell("water");
  swapped[5][3] = cell("water");
  assert(swap(swapped, { row: 5, col: 3 }, { row: 5, col: 2 }, GRAVITY.down), "horizontal swap should be legal when gravity is vertical");
  assert(findMatches(swapped).size === 3, "vertical swap should create a match");

  const verticalOnlyWhenSideways = Array.from({ length: 8 }, () => Array(COLS).fill(null));
  verticalOnlyWhenSideways[5][2] = cell("earth");
  assert(
    !swap(verticalOnlyWhenSideways, { row: 5, col: 2 }, { row: 4, col: 2 }, GRAVITY.down),
    "vertical swap should be blocked when gravity is vertical"
  );
  assert(
    swap(verticalOnlyWhenSideways, { row: 5, col: 2 }, { row: 4, col: 2 }, GRAVITY.right),
    "vertical swap should be legal when gravity is horizontal"
  );

  const rightGravity = Array.from({ length: 8 }, () => Array(COLS).fill(null));
  rightGravity[2][0] = cell("earth");
  rightGravity[2][3] = cell("fire");
  assert(applyGravity(rightGravity, GRAVITY.right), "right gravity should move blocks");
  assert(rightGravity[2][5]?.type === "fire", "rightmost block should settle against the right wall");
  assert(rightGravity[2][4]?.type === "earth", "left block should settle behind it with right gravity");

  const upGravity = Array.from({ length: 8 }, () => Array(COLS).fill(null));
  upGravity[6][1] = cell("shadow");
  upGravity[4][1] = cell("wind");
  assert(applyGravity(upGravity, GRAVITY.up), "up gravity should move blocks");
  assert(upGravity[0][1]?.type === "wind", "upper block should settle first when gravity is up");
  assert(upGravity[1][1]?.type === "shadow", "lower block should settle behind it when gravity is up");

  const unsupportedAfterSwap = Array.from({ length: 8 }, () => Array(COLS).fill(null));
  unsupportedAfterSwap[3][0] = cell("earth");
  assert(
    swap(unsupportedAfterSwap, { row: 3, col: 0 }, { row: 3, col: 1 }, GRAVITY.down),
    "swapping a block into empty space should be legal"
  );
  assert(applyGravity(unsupportedAfterSwap, GRAVITY.down), "unsupported swapped block should fall");
  assert(
    unsupportedAfterSwap[7][1]?.type === "earth",
    "unsupported swapped block should settle at the bottom of its new column"
  );
  assert(isBoardStable(unsupportedAfterSwap, GRAVITY.down), "settled swapped block board should be stable");

  const screenshotLikeFloat = Array.from({ length: 8 }, () => Array(COLS).fill(null));
  screenshotLikeFloat[1][3] = cell("wind");
  screenshotLikeFloat[1][4] = cell("wind");
  screenshotLikeFloat[2][1] = cell("fire");
  screenshotLikeFloat[2][2] = cell("fire");
  screenshotLikeFloat[2][3] = cell("shadow");
  screenshotLikeFloat[2][4] = cell("fire");
  screenshotLikeFloat[7][1] = cell("wind");
  screenshotLikeFloat[7][2] = cell("shadow");
  screenshotLikeFloat[7][3] = cell("shadow");
  screenshotLikeFloat[7][4] = cell("fire");
  assert(!isBoardStable(screenshotLikeFloat, GRAVITY.down), "floating cluster should be detected");
  assert(applyGravity(screenshotLikeFloat, GRAVITY.down), "floating cluster should settle");
  assert(isBoardStable(screenshotLikeFloat, GRAVITY.down), "floating cluster should be stable after settle");

  console.log("Board matching tests passed.");
}

run();
