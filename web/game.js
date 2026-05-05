(() => {
  const SAVE_KEY = "aurora-feint-browser-remake-v1";
  const AUDIO_SETTINGS_KEY = `${SAVE_KEY}-audio`;
  const W = 320;
  const H = 480;
  const TILE = 46;
  const COLS = 6;
  const VISIBLE_ROWS = 7;
  const GRID_ROWS = VISIBLE_ROWS + 1;
  const BOARD_X = 22;
  const BOARD_Y = 125;
  const BOARD_W = COLS * TILE;
  const BOARD_H = VISIBLE_ROWS * TILE;
  const PUZZLE_TILE = 43;
  const MINE_OPENING_ROWS = 4;
  const MINE_DIFFICULTIES = [
    { value: 1, label: "Quiet", speed: 3.8 },
    { value: 2, label: "Steady", speed: 4.7 },
    { value: 3, label: "Deep", speed: 5.6 },
    { value: 4, label: "Hurry", speed: 6.9 },
    { value: 5, label: "Collapse", speed: 8.4 },
  ];
  const GRAVITY = {
    up: { row: -1, col: 0, label: "U" },
    down: { row: 1, col: 0, label: "D" },
    left: { row: 0, col: -1, label: "L" },
    right: { row: 0, col: 1, label: "R" },
  };

  const phone = document.getElementById("phone");
  const ui = document.getElementById("ui");
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const resourceTypes = [
    {
      id: "earth",
      label: "Earth",
      block: "earth_block.png",
      orb: "elemental_block_earth.png",
      icon: "resource_icon_earth.png",
      color: "#9fb674",
    },
    {
      id: "fire",
      label: "Fire",
      block: "fire_block.png",
      orb: "elemental_block_fire.png",
      icon: "resource_icon_fire.png",
      color: "#e67d50",
    },
    {
      id: "water",
      label: "Water",
      block: "water_block.png",
      orb: "elemental_block_water.png",
      icon: "resource_icon_water.png",
      color: "#77a6c8",
    },
    {
      id: "wind",
      label: "Wind",
      block: "wind_block.png",
      orb: "elemental_block_wind.png",
      icon: "resource_icon_wind.png",
      color: "#d6d189",
    },
    {
      id: "shadow",
      label: "Shadow",
      block: "shadow_block.png",
      orb: "elemental_block_shadow.png",
      icon: "resource_icon_shadow.png",
      color: "#b59bd2",
    },
  ];

  const resourceById = Object.fromEntries(resourceTypes.map((type) => [type.id, type]));
  const specialBlocks = {
    compass: {
      label: "Dreameater",
      image: "wild_block_4_compass.png",
      color: "#f2c96f",
    },
    watch: {
      label: "Time",
      image: "wild_block_5_watch.png",
      color: "#85c5e6",
    },
    potion: {
      label: "Alchemy",
      image: "wild_block_6_joker.png",
      color: "#d0eb8d",
    },
    coal: {
      label: "Burn",
      image: "wild_block_3_bomb.png",
      color: "#e27e4a",
    },
    hammer2: {
      label: "x2",
      image: "wild_block_1.png",
      color: "#f0c36a",
      boost: 2,
    },
    hammer3: {
      label: "x3",
      image: "wild_block_2.png",
      color: "#ffe08b",
      boost: 3,
    },
  };
  const specialTypes = new Set(Object.keys(specialBlocks));
  const originalSounds = {
    click: ["audio/button_press.wav"],
    swap: ["audio/blocks_rotating.wav"],
    invalid: ["audio/block_shaking.wav"],
    pop: [
      "audio/standard_block_pop_1.wav",
      "audio/standard_block_pop_2.wav",
      "audio/standard_block_pop_3.wav",
      "audio/standard_block_pop_4.wav",
      "audio/standard_block_pop_5.wav",
    ],
    fall: ["audio/elemental_block_falling.wav"],
    tilt: ["audio/blocks_rotating.wav"],
    pull: ["audio/block_shaking.wav"],
    danger: ["audio/block_shaking.wav"],
    complete: ["audio/level_up_chime.wav"],
    wild: {
      compass: ["audio/wild_block_skull.wav"],
      watch: ["audio/wild_block_clock.wav"],
      coal: ["audio/wild_block_coal.wav"],
      potion: ["audio/wild_block_potion.wav"],
      hammer2: ["audio/wild_block_hammer_X2.wav"],
      hammer3: ["audio/wild_block_hammer_X3.wav"],
      default: ["audio/drop_wild_block.wav"],
    },
  };
  const storeItems = [
    {
      id: "blueprint-dreameater",
      kind: "blueprint",
      title: "Dreameater: The Acquisition",
      detail: "A smithing pattern for skull-marked blocks that bite a cluster out of the mine.",
      icon: "tool_icon_skull_large.png",
      crystalCost: 100,
      resources: { water: 50, wind: 50 },
      forgeCost: { water: 8, wind: 8 },
      target: { water: 10, wind: 10 },
      time: 119,
      reward: {
        id: "dreameater-tool",
        title: "Dreameater Tool",
        detail: "Skull blocks clear a tight ring of blocks when matched.",
        icon: "wild_block_4_compass_accessory.png",
      },
    },
    {
      id: "blueprint-time",
      kind: "blueprint",
      title: "Watchmaker: First Loop",
      detail: "A tool pattern for slowing the mine's ascent.",
      icon: "tool_icon_time_stopper_large.png",
      crystalCost: 160,
      resources: { earth: 40, water: 40, shadow: 20 },
      forgeCost: { earth: 10, water: 10, shadow: 6 },
      target: { earth: 12, water: 12, shadow: 6 },
      time: 139,
      reward: {
        id: "watchmaker-loop",
        title: "Watchmaker Loop",
        detail: "Watch blocks sometimes hold the mine steady.",
        icon: "wild_block_5_watch_accessory.png",
      },
    },
    {
      id: "blueprint-potion",
      kind: "blueprint",
      title: "Alchemist's Joker",
      detail: "A volatile pattern for potion blocks that wash away one essence type.",
      icon: "tool_icon_magic_potion_large.png",
      crystalCost: 135,
      resources: { water: 45, wind: 35, shadow: 20 },
      forgeCost: { water: 10, wind: 8, shadow: 4 },
      target: { water: 12, wind: 8, shadow: 5 },
      time: 134,
      reward: {
        id: "alchemist-joker",
        title: "Alchemist's Joker",
        detail: "Potion blocks clear matching colors across the board.",
        icon: "wild_block_6_joker_accessory.png",
      },
    },
    {
      id: "blueprint-coal",
      kind: "blueprint",
      title: "Redhot Coal",
      detail: "A furnace pattern for coal blocks that burn through the current pull of gravity.",
      icon: "tool_icon_redhotcoal_large.png",
      crystalCost: 130,
      resources: { fire: 55, earth: 30 },
      forgeCost: { fire: 10, earth: 6 },
      target: { fire: 12, earth: 8 },
      time: 129,
      reward: {
        id: "redhot-coal",
        title: "Redhot Coal",
        detail: "Coal blocks burn a row or column in the gravity direction.",
        icon: "wild_block_3_bomb_accessory.png",
      },
    },
    {
      id: "blueprint-hammer-2x",
      kind: "blueprint",
      title: "Hammer: Double Strike",
      detail: "A compact hammer pattern that doubles nearby essence during a match.",
      icon: "tool_icon_hammer_2x_large.png",
      crystalCost: 90,
      resources: { earth: 45, fire: 20 },
      forgeCost: { earth: 8, fire: 4 },
      target: { earth: 10, fire: 6 },
      time: 119,
      reward: {
        id: "hammer-2x",
        title: "Hammer x2",
        detail: "Hammer x2 blocks boost adjacent resource blocks.",
        icon: "wild_block_1_accessory.png",
      },
    },
    {
      id: "blueprint-hammer-3x",
      kind: "blueprint",
      title: "Hammer: Triple Strike",
      detail: "A heavier hammer pattern that can set up much larger resource bursts.",
      icon: "tool_icon_hammer_x3_large.png",
      crystalCost: 220,
      resources: { earth: 80, fire: 45, shadow: 35 },
      forgeCost: { earth: 16, fire: 10, shadow: 8 },
      target: { earth: 14, fire: 10, shadow: 8 },
      time: 154,
      reward: {
        id: "hammer-3x",
        title: "Hammer x3",
        detail: "Hammer x3 blocks make adjacent resource blocks worth triple.",
        icon: "wild_block_2_accessory.png",
      },
    },
    {
      id: "magicbook-earth",
      kind: "magicbook",
      title: "Earth Mastery I",
      detail: "A tower puzzle that improves earth essence value.",
      icon: "icon_magicbook.png",
      crystalCost: 120,
      resources: { earth: 60, shadow: 20 },
      puzzle: { moves: 4, goal: 10, mastery: "earth" },
    },
    {
      id: "magicbook-fire",
      kind: "magicbook",
      title: "Fire Mastery I",
      detail: "A tower puzzle that improves fire essence value.",
      icon: "icon_magicbook.png",
      crystalCost: 120,
      resources: { fire: 60, earth: 20 },
      puzzle: { moves: 4, goal: 12, mastery: "fire" },
    },
    {
      id: "magicbook-water",
      kind: "magicbook",
      title: "Water Mastery I",
      detail: "A tower puzzle that improves water essence value.",
      icon: "icon_magicbook.png",
      crystalCost: 120,
      resources: { water: 60, wind: 20 },
      puzzle: { moves: 4, goal: 10, mastery: "water" },
    },
    {
      id: "magicbook-wind",
      kind: "magicbook",
      title: "Wind Mastery I",
      detail: "A tower puzzle that improves wind essence value.",
      icon: "icon_magicbook.png",
      crystalCost: 120,
      resources: { wind: 60, fire: 20 },
      puzzle: { moves: 4, goal: 11, mastery: "wind" },
    },
    {
      id: "magicbook-shadow",
      kind: "magicbook",
      title: "Shadow Mastery I",
      detail: "A tower puzzle that improves shadow essence value.",
      icon: "icon_magicbook.png",
      crystalCost: 150,
      resources: { shadow: 70, water: 25 },
      puzzle: { moves: 4, goal: 9, mastery: "shadow" },
    },
  ];

  const towerPuzzleLayouts = {
    earth: {
      moves: 4,
      goal: 10,
      gravity: "left",
      layout: [
        "AENNES",
        "SNSENE",
        "EFSSEE",
        "NENENS",
        "FEENSF",
      ],
      runes: ["3,2", "3,3", "3,4", "4,1", "4,2", "4,3", "2,2", "2,3", "2,4", "4,4"],
    },
    fire: {
      moves: 4,
      goal: 12,
      gravity: "up",
      layout: [
        "AEAEEA",
        "NENSEE",
        "NNFESE",
        "AEAEES",
        "AEENNE",
      ],
      runes: ["2,0", "2,1", "2,2", "3,1", "3,2", "3,3", "3,4", "0,1", "1,1", "1,3", "1,4", "1,5"],
    },
    water: {
      moves: 4,
      goal: 10,
      gravity: "right",
      layout: [
        "NAAEEN",
        "ESSFSE",
        "NESESN",
        "NSAANN",
        "ASNENS",
      ],
      runes: ["1,1", "2,1", "3,1", "4,1", "2,0", "3,0", "4,0", "2,4", "3,4", "4,4"],
    },
    wind: {
      moves: 4,
      goal: 11,
      gravity: "left",
      layout: [
        "NFFNNS",
        "NNEFSS",
        "ANFESE",
        "EASEAE",
        "EFFANN",
      ],
      runes: ["0,2", "1,2", "2,2", "1,3", "2,3", "3,3", "3,2", "4,3", "0,4", "1,4", "2,4"],
    },
    shadow: {
      moves: 4,
      goal: 9,
      gravity: "up",
      layout: [
        "ESSEEA",
        "NSESFF",
        "ENNFFN",
        "ESNSSE",
        "NAEENA",
      ],
      runes: ["0,2", "0,3", "0,4", "1,1", "1,2", "1,3", "1,0", "0,0", "2,0"],
    },
  };

  const toolMasteries = [
    { id: "dreameater-tool", special: "compass", label: "Dreameater", icon: "tool_icon_skull_small.png" },
    { id: "alchemist-joker", special: "potion", label: "Alchemist", icon: "tool_icon_magic_potion_small.png" },
    { id: "watchmaker-loop", special: "watch", label: "Time Stopper", icon: "tool_icon_time_stopper_small.png" },
    { id: "hammer-2x", special: "hammer2", label: "Strategist", icon: "tool_icon_hammer_2x_small.png" },
    { id: "redhot-coal", special: "coal", label: "Furlie", icon: "tool_icon_redhotcoal_small.png" },
    { id: "hammer-3x", special: "hammer3", label: "Sorcerer", icon: "tool_icon_hammer_x3_small.png" },
  ];

  const toolMasteryBySpecial = Object.fromEntries(toolMasteries.map((tool) => [tool.special, tool]));

  const imageNames = new Set([
    "Default.png",
    "Night_Woods_Dark_BG.png",
    "map_background.png",
    "navigation_bar.png",
    "menu_action_button_dark.png",
    "button_arrow_left_cap_right.png",
    "button_arrow_right_cap_left.png",
    "Icon2.png",
    "character_female_portrait.png",
    "character_male_portrait.png",
    "character_female_cropped_head.png",
    "character_male_cropped_head.png",
    "character_holder.png",
    "character_portrait_undisclosed.png",
    "tab_icon_party.png",
    "tab_icon_party_selected.png",
    "tab_icon_inventory.png",
    "tab_icon_inventory_selected.png",
    "tab_icon_community.png",
    "tab_icon_community_selected.png",
    "icon_scroll.png",
    "icon_skills.png",
    "icon_weapons.png",
    "icon_armor.png",
    "icon_accessories.png",
    "map_location_main_menu_normal.png",
    "map_location_mine_normal_glow.png",
    "map_location_store_normal_glow.png",
    "map_location_smith_normal_glow.png",
    "map_location_alchemy_normal_glow.png",
    "hud_background_mining.png",
    "hud_background_smithing.png",
    "hud_background_alchemy.png",
    "hud_border_mining.png",
    "hud_border_smithing.png",
    "hud_border_alchemy.png",
    "PowerBar.png",
    "PowerBar_Filled.png",
    "PowerBar_Glow.png",
    "Pause_Button.png",
    "Pause_Button_Glow.png",
    "elemental_block_glow.png",
    "row_column_explosion.png",
    "color_typed_explosion.png",
    "mining_details_view_background.png",
    "mining_game_startup_background.png",
    "smithing_details_view_background.png",
    "alchemy_details_view_background.png",
    "icon_crystals.png",
    "icon_timer.png",
    "icon_moves.png",
    "icon_blueprint.png",
    "icon_magicbook.png",
    "icon_blueprint_solved.png",
    "icon_magicbook_solved.png",
    "icon_disclosure_buy.png",
    "menu_details_button.png",
    "menu_details_button_dark.png",
    "menu_table_top.png",
    "menu_table_middle.png",
    "menu_table_bottom.png",
    "tool_icon_skull_large.png",
    "tool_icon_time_stopper_large.png",
    "tool_icon_magic_potion_large.png",
    "tool_icon_redhotcoal_large.png",
    "tool_icon_hammer_2x_large.png",
    "tool_icon_hammer_x3_large.png",
    "tool_icon_skull_small.png",
    "tool_icon_time_stopper_small.png",
    "tool_icon_magic_potion_small.png",
    "tool_icon_redhotcoal_small.png",
    "tool_icon_hammer_2x_small.png",
    "tool_icon_hammer_x3_small.png",
    "wild_block_4_compass.png",
    "wild_block_4_compass_accessory.png",
    "wild_block_5_watch.png",
    "wild_block_5_watch_accessory.png",
    "wild_block_1.png",
    "wild_block_1_accessory.png",
    "wild_block_2.png",
    "wild_block_2_accessory.png",
    "wild_block_3_bomb.png",
    "wild_block_3_bomb_accessory.png",
    "wild_block_6_joker.png",
    "wild_block_6_joker_accessory.png",
    "wild_block_holder.png",
  ]);

  for (const type of resourceTypes) {
    imageNames.add(type.block);
    imageNames.add(type.orb);
    imageNames.add(type.icon);
  }

  const images = {};
  let state = loadState();
  let storeFilter = "tools";
  let selectedStoreItemId = null;
  let boardGame = null;
  let lastSensorTiltAt = 0;
  let rafId = 0;
  let lastFrame = performance.now();
  let pointerStart = null;
  let tiltSensorEnabled = false;
  let nextCellId = 1;
  let audioContext = null;
  let masterGain = null;
  let sfxGain = null;
  let musicGain = null;
  let noiseBuffer = null;
  let musicState = null;
  let audioSettings = loadAudioSettings();
  const audioPools = new Map();
  const lastSoundAt = {};

  function asset(name) {
    return `assets/${name.split("/").map(encodeURIComponent).join("/")}`;
  }

  function emptyResources(value = 0) {
    return Object.fromEntries(resourceTypes.map((type) => [type.id, value]));
  }

  function makeCell(type, extra = {}) {
    return { id: nextCellId++, type, ...extra };
  }

  function loadAudioSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY));
      return {
        muted: Boolean(parsed?.muted),
        sfx: Number.isFinite(parsed?.sfx) ? parsed.sfx : 0.82,
        music: Number.isFinite(parsed?.music) ? parsed.music : 0.24,
      };
    } catch {
      return { muted: false, sfx: 0.82, music: 0.24 };
    }
  }

  function saveAudioSettings() {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(audioSettings));
  }

  function unlockAudio() {
    ensureAudioGraph();
    if (!audioContext) return;
    if (audioContext.state === "suspended") audioContext.resume();
    updateAudioLevels();
    if (boardGame?.status === "playing") startMusic(boardGame.mode);
  }

  function ensureAudioGraph() {
    if (audioContext) return;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    try {
      audioContext = new AudioCtor();
      masterGain = audioContext.createGain();
      sfxGain = audioContext.createGain();
      musicGain = audioContext.createGain();
      sfxGain.connect(masterGain);
      musicGain.connect(masterGain);
      masterGain.connect(audioContext.destination);
      updateAudioLevels(true);
    } catch {
      audioContext = null;
      masterGain = null;
      sfxGain = null;
      musicGain = null;
    }
  }

  function updateAudioLevels(immediate = false) {
    if (!audioContext || !masterGain) return;
    const now = audioContext.currentTime;
    const ramp = immediate ? 0 : 0.035;
    masterGain.gain.setTargetAtTime(audioSettings.muted ? 0 : 1, now, ramp || 0.001);
    sfxGain.gain.setTargetAtTime(audioSettings.sfx, now, ramp || 0.001);
    musicGain.gain.setTargetAtTime(audioSettings.music, now, ramp || 0.001);
  }

  function toggleAudio() {
    audioSettings = { ...audioSettings, muted: !audioSettings.muted };
    saveAudioSettings();
    unlockAudio();
    updateSoundButtons();
    if (audioSettings.muted) {
      stopMusic();
      stopOriginalSounds();
    }
    else if (boardGame?.status === "playing") startMusic(boardGame.mode);
    if (!audioSettings.muted) playSound("click", { force: true });
  }

  function playSound(kind, options = {}) {
    if (audioSettings.muted && !options.force) return;
    ensureAudioGraph();
    if (audioContext?.state === "suspended") audioContext.resume();

    const nowMs = performance.now();
    const spacing = kind === "pop" || kind === "fall" ? 70 : kind === "danger" ? 420 : 35;
    if (lastSoundAt[kind] && nowMs - lastSoundAt[kind] < spacing) return;
    lastSoundAt[kind] = nowMs;
    if (playOriginalSound(kind, options)) return;
    if (!audioContext) return;

    switch (kind) {
      case "click":
        playTone({ frequency: 520, type: "square", duration: 0.035, volume: 0.018 });
        break;
      case "swap":
        playTone({ frequency: 210, endFrequency: 310, type: "triangle", duration: 0.07, volume: 0.035 });
        playTone({ frequency: 420, start: 0.035, type: "sine", duration: 0.045, volume: 0.018 });
        break;
      case "invalid":
        playTone({ frequency: 98, endFrequency: 74, type: "sawtooth", duration: 0.12, volume: 0.028 });
        break;
      case "pop":
        playPop(options);
        break;
      case "fall":
        playTone({ frequency: 76, endFrequency: 48, type: "triangle", duration: 0.13, volume: 0.048 });
        playNoise({ duration: 0.08, volume: 0.028, filterFrequency: 360 });
        break;
      case "tilt":
        playNoise({ duration: 0.18, volume: 0.018, filterFrequency: 700, endFilterFrequency: 1800 });
        playTone({ frequency: 145, endFrequency: 235, type: "sine", duration: 0.16, volume: 0.018 });
        break;
      case "pull":
        playNoise({ duration: 0.24, volume: 0.032, filterFrequency: 520, endFilterFrequency: 220 });
        playTone({ frequency: 132, endFrequency: 92, type: "sawtooth", duration: 0.16, volume: 0.02 });
        break;
      case "wild":
        playWild(options.type);
        break;
      case "danger":
        playNoise({ duration: 0.34, volume: 0.08, filterFrequency: 190 });
        playTone({ frequency: 64, endFrequency: 38, type: "sawtooth", duration: 0.42, volume: 0.055 });
        break;
      case "complete":
        playChord([392, 494, 659], 0, 0.38, 0.032);
        playChord([523, 659, 784], 0.18, 0.44, 0.03);
        break;
      case "fail":
        playTone({ frequency: 196, endFrequency: 92, type: "triangle", duration: 0.55, volume: 0.035 });
        break;
      default:
        playTone({ frequency: 420, type: "sine", duration: 0.06, volume: 0.02 });
        break;
    }
  }

  function playOriginalSound(kind, options = {}) {
    const file = originalSoundFor(kind, options);
    if (!file) return false;

    const audio = pooledAudio(file);
    audio.volume = Math.max(0, Math.min(1, audioSettings.sfx * (options.volume ?? 0.86)));
    try {
      audio.currentTime = 0;
    } catch {
      // Some browsers wait for metadata before allowing currentTime changes.
    }
    const playResult = audio.play();
    if (playResult?.catch) playResult.catch(() => {});
    return true;
  }

  function originalSoundFor(kind, options = {}) {
    if (kind === "wild") {
      const group = originalSounds.wild[options.type] || originalSounds.wild.default;
      return randomEntry(group);
    }
    const group = originalSounds[kind];
    return Array.isArray(group) ? randomEntry(group) : null;
  }

  function pooledAudio(file) {
    const pool = audioPools.get(file) || [];
    let audio = pool.find((candidate) => candidate.paused || candidate.ended);
    if (!audio) {
      audio = new Audio(asset(file));
      audio.preload = "auto";
      pool.push(audio);
      audioPools.set(file, pool);
    }
    return audio;
  }

  function stopOriginalSounds() {
    for (const pool of audioPools.values()) {
      for (const audio of pool) {
        audio.pause();
        try {
          audio.currentTime = 0;
        } catch {
          // Ignore files that have not loaded enough metadata yet.
        }
      }
    }
  }

  function randomEntry(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function playPop(options = {}) {
    const count = Math.min(7, Math.max(3, options.count || 3));
    const multiplier = options.multiplier || 1;
    const base = 420 + Math.random() * 90 + multiplier * 22;
    playNoise({ duration: 0.04 + count * 0.006, volume: 0.035, filterFrequency: 1600 });
    playTone({ frequency: base, endFrequency: base * 1.45, type: "sine", duration: 0.075, volume: 0.034 });
    playTone({ frequency: base * 1.52, start: 0.026, type: "triangle", duration: 0.065, volume: 0.02 });
    if (multiplier > 1) playTone({ frequency: base * 2, start: 0.08, type: "sine", duration: 0.12, volume: 0.018 });
  }

  function playWild(type) {
    if (type === "watch") {
      playTone({ frequency: 880, type: "sine", duration: 0.08, volume: 0.025 });
      playTone({ frequency: 660, start: 0.11, type: "sine", duration: 0.1, volume: 0.022 });
      playTone({ frequency: 440, start: 0.24, type: "sine", duration: 0.12, volume: 0.02 });
      return;
    }
    if (type === "coal") {
      playNoise({ duration: 0.22, volume: 0.065, filterFrequency: 420 });
      playTone({ frequency: 86, endFrequency: 55, type: "sawtooth", duration: 0.24, volume: 0.04 });
      return;
    }
    if (type === "potion") {
      playChord([330, 494, 740], 0, 0.18, 0.024);
      playTone({ frequency: 988, start: 0.12, type: "sine", duration: 0.16, volume: 0.018 });
      return;
    }
    if (type === "hammer2" || type === "hammer3") {
      playTone({ frequency: 150, type: "square", duration: 0.075, volume: 0.04 });
      playTone({ frequency: type === "hammer3" ? 225 : 200, start: 0.08, type: "square", duration: 0.085, volume: 0.035 });
      return;
    }
    playNoise({ duration: 0.12, volume: 0.035, filterFrequency: 1000 });
    playChord([294, 588, 882], 0.02, 0.18, 0.026);
  }

  function playChord(frequencies, start, duration, volume) {
    frequencies.forEach((frequency, index) => {
      playTone({
        frequency,
        start: start + index * 0.012,
        type: index ? "sine" : "triangle",
        duration,
        volume,
      });
    });
  }

  function playTone({
    frequency,
    endFrequency = frequency,
    start = 0,
    duration = 0.08,
    volume = 0.03,
    type = "sine",
    destination = sfxGain,
  }) {
    if (!audioContext || !destination) return;
    const now = audioContext.currentTime + start;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency !== frequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  function playNoise({ start = 0, duration = 0.08, volume = 0.025, filterFrequency = 900, endFilterFrequency = filterFrequency }) {
    if (!audioContext || !sfxGain) return;
    const now = audioContext.currentTime + start;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    source.buffer = getNoiseBuffer();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(filterFrequency, now);
    if (endFilterFrequency !== filterFrequency) filter.frequency.exponentialRampToValueAtTime(Math.max(10, endFilterFrequency), now + duration);
    filter.Q.value = 0.9;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  function getNoiseBuffer() {
    if (noiseBuffer || !audioContext) return noiseBuffer;
    const length = audioContext.sampleRate;
    noiseBuffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      last = last * 0.82 + (Math.random() * 2 - 1) * 0.18;
      data[i] = last;
    }
    return noiseBuffer;
  }

  function startMusic(mode) {
    if (!audioContext || !musicGain || audioSettings.muted) return;
    const kind = mode === "mine" ? "mine" : mode === "craft" ? "craft" : "puzzle";
    if (musicState?.kind === kind) return;
    stopMusic();

    const output = audioContext.createGain();
    output.gain.value = 0.0001;
    output.gain.exponentialRampToValueAtTime(0.75, audioContext.currentTime + 0.9);
    output.connect(musicGain);

    const notes = kind === "mine" ? [55, 82.41, 110] : kind === "craft" ? [65.41, 98, 130.81] : [73.42, 110, 146.83];
    const oscillators = notes.map((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.05 : 0.018;
      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start();
      return oscillator;
    });

    const timer = window.setInterval(() => playAmbientSpark(kind), kind === "mine" ? 6200 : 4800);
    musicState = { kind, output, oscillators, timer };
  }

  function stopMusic() {
    if (!musicState) return;
    const oscillators = musicState.oscillators || [];
    if (musicState.timer) window.clearInterval(musicState.timer);
    if (audioContext && musicState.output) {
      const now = audioContext.currentTime;
      musicState.output.gain.cancelScheduledValues(now);
      musicState.output.gain.setTargetAtTime(0.0001, now, 0.18);
      window.setTimeout(() => {
        oscillators.forEach((oscillator) => {
          try {
            oscillator.stop();
          } catch {
            // Already stopped.
          }
        });
      }, 260);
    }
    musicState = null;
  }

  function playAmbientSpark(kind) {
    if (!audioContext || audioSettings.muted || !musicGain) return;
    const base = kind === "mine" ? 220 : kind === "craft" ? 262 : 294;
    playTone({ frequency: base, start: 0, duration: 0.42, volume: 0.012, type: "sine", destination: musicGain });
    playTone({ frequency: base * 1.5, start: 0.18, duration: 0.38, volume: 0.01, type: "sine", destination: musicGain });
  }

  function defaultState() {
    return {
      character: null,
      level: 1,
      xp: 0,
      crystals: 35,
      mineDifficulty: 3,
      resources: emptyResources(25),
      owned: [],
      blueprints: [],
      magicbooks: [],
      equipment: [],
      mastery: emptyResources(1),
      craftFailures: {},
      toolMastery: {},
      stats: {
        largestCombo: 0,
        mostBlocksPopped: 0,
        longestChain: 0,
      },
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY));
      return normalizeState(parsed || defaultState());
    } catch {
      return defaultState();
    }
  }

  function normalizeState(raw) {
    const base = defaultState();
    return {
      ...base,
      ...raw,
      resources: { ...base.resources, ...(raw.resources || {}) },
      mineDifficulty: normalizeMineDifficulty(raw.mineDifficulty ?? base.mineDifficulty),
      mastery: { ...base.mastery, ...(raw.mastery || {}) },
      owned: Array.isArray(raw.owned) ? raw.owned : [],
      blueprints: Array.isArray(raw.blueprints) ? raw.blueprints : [],
      magicbooks: Array.isArray(raw.magicbooks) ? raw.magicbooks : [],
      equipment: Array.isArray(raw.equipment) ? raw.equipment : [],
      craftFailures: raw.craftFailures && typeof raw.craftFailures === "object" ? raw.craftFailures : {},
      toolMastery: raw.toolMastery && typeof raw.toolMastery === "object" ? raw.toolMastery : {},
      stats: { ...base.stats, ...(raw.stats || {}) },
    };
  }

  function saveState() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function preloadImages() {
    const loads = [...imageNames].map((name) => {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => resolve();
        image.src = asset(name);
        images[name] = image;
      });
    });
    return Promise.all(loads);
  }

  function setScreen(name) {
    if (name !== "mine" && name !== "puzzle") stopBoard();
    phone.className = `screen ${name}`;
    ui.innerHTML = "";
  }

  function button(className, text, onClick, options = {}) {
    const node = document.createElement("button");
    node.className = className;
    node.type = "button";
    node.textContent = text;
    if (options.title) node.title = options.title;
    if (options.disabled) node.disabled = true;
    node.addEventListener("click", (event) => {
      unlockAudio();
      playSound("click");
      onClick(event);
    });
    return node;
  }

  function img(name, className = "") {
    const node = document.createElement("img");
    node.src = asset(name);
    node.alt = "";
    if (className) node.className = className;
    return node;
  }

  function topBar(title, backTarget = renderMap, right = null, backLabel = "Back") {
    const bar = document.createElement("div");
    bar.className = "top-bar";
    bar.append(
      button("nav-btn", backLabel, backTarget, { title: backLabel }),
      Object.assign(document.createElement("h1"), { className: "title", textContent: title }),
      right || document.createElement("span")
    );
    ui.append(bar);
  }

  function renderSplash() {
    setScreen("splash");
    const stack = document.createElement("div");
    stack.className = "stack";
    stack.append(
      button("stone-btn", state.character ? "Continue" : "Begin", () => {
        if (state.character) renderMap();
        else renderCharacter();
      }),
      button("stone-btn", "Opening", renderOpening),
      button("small-btn", "Reset", confirmReset)
    );
    ui.append(stack);
  }

  function renderOpening() {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    const modal = document.createElement("div");
    modal.className = "modal";
    const video = document.createElement("video");
    video.controls = true;
    video.src = asset("opening_trailer.m4v");
    video.style.width = "100%";
    video.style.background = "#000";
    modal.append(
      Object.assign(document.createElement("h2"), { textContent: "Opening" }),
      video,
      button("stone-btn", "Close", () => backdrop.remove())
    );
    backdrop.append(modal);
    ui.append(backdrop);
  }

  function confirmReset() {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.append(
      Object.assign(document.createElement("h2"), { textContent: "Start Over" }),
      Object.assign(document.createElement("p"), {
        textContent: "This clears the browser save for this remake.",
      }),
      button("stone-btn", "Reset", () => {
        state = defaultState();
        saveState();
        renderSplash();
      }),
      button("small-btn", "Cancel", () => backdrop.remove())
    );
    backdrop.append(modal);
    ui.append(backdrop);
  }

  function renderCharacter() {
    setScreen("character");
    topBar("Choose A Character", renderSplash);
    const grid = document.createElement("div");
    grid.className = "choice-grid";
    grid.append(
      characterChoice(
        "female",
        "Leaf Seer",
        "character_female_portrait.png",
        "Wind, water, and shadow begin slightly ahead."
      ),
      characterChoice(
        "male",
        "Horn Warden",
        "character_male_portrait.png",
        "Earth, fire, and crystal gains begin slightly ahead."
      )
    );
    ui.append(grid);
  }

  function characterChoice(id, title, portrait, detail) {
    const node = button("character-choice", "", () => {
      state.character = id;
      if (id === "female") {
        state.resources.wind += 25;
        state.resources.water += 25;
        state.resources.shadow += 15;
      } else {
        state.resources.earth += 25;
        state.resources.fire += 25;
        state.crystals += 25;
      }
      saveState();
      renderMap();
    });
    node.append(
      img(portrait),
      Object.assign(document.createElement("strong"), { textContent: title }),
      Object.assign(document.createElement("span"), { textContent: detail })
    );
    return node;
  }

  function renderMap() {
    setScreen("map");

    const menu = button("map-menu", "Menu", renderMenu, { title: "Menu" });
    ui.append(menu);

    ui.append(
      mapHotspot("mine", "Mine", renderMineSetup),
      mapHotspot("store", "Store", renderStore),
      mapHotspot("smith", "Smith", renderSmith),
      mapHotspot("tower", "Tower", renderTower),
      resourceStrip()
    );
  }

  function mapHotspot(kind, title, onClick) {
    return button(`map-hotspot ${kind}`, title, onClick, { title });
  }

  function renderMineSetup() {
    setScreen("mine-setup");
    topBar("The Mine", renderMap, null, "Map");

    let selected = normalizeMineDifficulty(state.mineDifficulty);
    const panel = document.createElement("div");
    panel.className = "mine-setup-panel";

    const heading = Object.assign(document.createElement("h2"), { textContent: "Adjust the game difficulty." });
    const note = Object.assign(document.createElement("p"), {
      className: "mine-setup-note",
      textContent: "Level up your character to access faster speeds.",
    });
    const current = Object.assign(document.createElement("strong"), { className: "mine-depth-label" });

    const labels = document.createElement("div");
    labels.className = "mine-slider-labels";
    labels.append(
      Object.assign(document.createElement("span"), { textContent: "Slower (0)" }),
      Object.assign(document.createElement("span"), { textContent: "Faster (100)" })
    );

    const slider = document.createElement("input");
    slider.className = "mine-depth-slider";
    slider.type = "range";
    slider.min = "1";
    slider.max = "5";
    slider.step = "1";
    slider.value = String(selected);

    const update = () => {
      selected = normalizeMineDifficulty(slider.value);
      const settings = mineDifficultySettings(selected);
      current.textContent = String((settings.value - 1) * 25);
    };
    slider.addEventListener("input", update);
    update();

    panel.append(
      heading,
      note,
      labels,
      slider,
      current,
      button("stone-btn", "Play Mining Game", () => startMine(selected))
    );
    ui.append(panel);
  }

  function startMine(difficulty = state.mineDifficulty) {
    state.mineDifficulty = normalizeMineDifficulty(difficulty);
    saveState();
    startBoard("mine", null, { difficulty: state.mineDifficulty });
  }

  function normalizeMineDifficulty(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 3;
    return Math.max(1, Math.min(5, Math.round(parsed)));
  }

  function mineDifficultySettings(value) {
    return MINE_DIFFICULTIES.find((difficulty) => difficulty.value === normalizeMineDifficulty(value)) || MINE_DIFFICULTIES[2];
  }

  function resourceStrip() {
    const strip = document.createElement("div");
    strip.className = "hud-strip";
    for (const type of resourceTypes) {
      const chip = document.createElement("div");
      chip.className = "resource-chip";
      chip.append(img(type.icon), document.createTextNode(formatCount(state.resources[type.id])));
      strip.append(chip);
    }
    return strip;
  }

  function renderMenu() {
    renderParty();
  }

  function renderParty() {
    setScreen("party");
    topBar("Your Party", renderMap, resumeButton());

    const content = rpgContent("party-list");
    content.append(playerPartyCard());
    for (let index = 0; index < 3; index += 1) {
      content.append(friendPartyCard(index));
    }
    ui.append(content, bottomTabs("party"));
  }

  function renderCharacterSheet() {
    setScreen("character-detail");
    topBar("Character", renderParty, resumeButton());

    const content = rpgContent("character-sheet");
    content.append(characterHeroPanel(), characterStatsPanel(), masteryPanel("Tool Mastery", toolMasteryRows()), masteryPanel("Essence Mastery", essenceMasteryRows()));
    ui.append(content, bottomTabs("party"));
  }

  function renderInventory() {
    setScreen("inventory");
    topBar("Inventory", renderMap, resumeButton());

    const content = rpgContent("inventory-list");
    content.append(inventorySummaryPanel());
    content.append(inventorySection("Knowledge", [
      inventoryRow("icon_blueprint.png", "Blueprints", state.blueprints.length, renderSmith),
      inventoryRow("icon_magicbook.png", "Magic Books", state.magicbooks.length, renderTower),
      inventoryRow("icon_scroll.png", "Scrolls", 0),
    ]));
    content.append(inventorySection("Equippables", [
      inventoryRow("icon_skills.png", "Tools", state.equipment.length, renderCharacterSheet),
      inventoryRow("icon_weapons.png", "Weapons", 0),
      inventoryRow("icon_armor.png", "Armor", 0),
      inventoryRow("icon_accessories.png", "Accessories", state.equipment.length),
    ]));
    ui.append(content, bottomTabs("inventory"));
  }

  function renderCommunity() {
    setScreen("community");
    topBar("Community", renderMap, resumeButton());

    const content = rpgContent("community-list");
    const panel = document.createElement("div");
    panel.className = "rpg-panel community-panel";
    panel.append(
      Object.assign(document.createElement("h2"), { textContent: "Community" }),
      Object.assign(document.createElement("p"), {
        textContent: "Friends, shared party members, and online Feint services are represented here for the original UI flow.",
      }),
      statRow("tab_icon_party.png", "Friends", "Offline"),
      statRow("icon_crystals.png", "Feint Scores", "Offline"),
      statRow("icon_scroll.png", "Messages", "Offline")
    );
    content.append(panel);
    ui.append(content, bottomTabs("community"));
  }

  function resumeButton() {
    return button("nav-btn right", "Resume", renderMap, { title: "Resume" });
  }

  function rpgContent(extra = "") {
    const content = document.createElement("div");
    content.className = `rpg-content ${extra}`.trim();
    return content;
  }

  function playerPartyCard() {
    const node = button("party-card player", "", renderCharacterSheet, { title: "Character" });
    node.append(
      img(characterHead(), "party-portrait"),
      partyCopy(characterName(), "Owned By You", `Category One - Level ${state.level}`),
      img("button_arrow_right_cap_left.png", "disclosure")
    );
    return node;
  }

  function friendPartyCard(index) {
    const node = document.createElement("div");
    node.className = "party-card locked";
    node.append(
      img("character_portrait_undisclosed.png", "party-portrait"),
      partyCopy("Character Name", "Owned By Your Friend", "Level ?"),
      img("button_arrow_right_cap_left.png", "disclosure")
    );
    return node;
  }

  function partyCopy(title, owner, detail) {
    const copy = document.createElement("span");
    copy.className = "party-copy";
    copy.append(
      Object.assign(document.createElement("strong"), { textContent: title }),
      Object.assign(document.createElement("span"), { textContent: owner }),
      Object.assign(document.createElement("em"), { textContent: detail })
    );
    return copy;
  }

  function characterHeroPanel() {
    const panel = document.createElement("div");
    panel.className = "rpg-panel character-hero";
    panel.append(
      img(characterPortrait(), "character-full"),
      characterIdentity()
    );
    return panel;
  }

  function characterIdentity() {
    const info = document.createElement("div");
    info.className = "character-identity";
    const progress = document.createElement("div");
    progress.className = "xp-bar";
    const fill = document.createElement("span");
    fill.style.width = `${Math.min(100, (state.xp / xpNeeded()) * 100)}%`;
    progress.append(fill);
    info.append(
      Object.assign(document.createElement("h2"), { textContent: characterName() }),
      Object.assign(document.createElement("span"), { textContent: "Owned By You" }),
      statRow("icon_skills.png", "Category One", `Level ${state.level}`),
      progress
    );
    return info;
  }

  function characterStatsPanel() {
    const panel = document.createElement("div");
    panel.className = "rpg-panel character-stats";
    panel.append(
      statRow("icon_moves.png", "Largest Combo", state.stats.largestCombo),
      statRow("icon_crystals.png", "Most Blocks Popped", state.stats.mostBlocksPopped),
      statRow("icon_timer.png", "Longest Chain", state.stats.longestChain)
    );
    return panel;
  }

  function masteryPanel(title, rows) {
    const panel = document.createElement("div");
    panel.className = "rpg-panel mastery-panel";
    const heading = document.createElement("div");
    heading.className = "mastery-heading";
    heading.append(
      Object.assign(document.createElement("strong"), { textContent: title }),
      Object.assign(document.createElement("span"), { textContent: "Levels" })
    );
    panel.append(heading, ...rows);
    return panel;
  }

  function toolMasteryRows() {
    return toolMasteries.map((tool) => masteryRow(tool.icon, tool.label, toolMasteryLevel(tool.id), 8));
  }

  function essenceMasteryRows() {
    return resourceTypes.map((type) => masteryRow(type.icon, type.label, essenceMasteryLevel(type.id), 1));
  }

  function masteryRow(icon, label, level, max) {
    const row = document.createElement("div");
    row.className = "mastery-row";
    row.append(img(icon), document.createTextNode(label), Object.assign(document.createElement("span"), { textContent: `${level}/${max}` }));
    return row;
  }

  function inventorySummaryPanel() {
    const panel = document.createElement("div");
    panel.className = "rpg-panel inventory-summary";
    for (const tool of toolMasteries) {
      panel.append(summaryChip(tool.icon, toolMasteryLevel(tool.id)));
    }
    return panel;
  }

  function summaryChip(icon, count) {
    const chip = document.createElement("span");
    chip.className = "summary-chip";
    chip.append(img(icon), document.createTextNode(String(count)));
    return chip;
  }

  function inventorySection(title, rows) {
    const section = document.createElement("div");
    section.className = "inventory-section";
    section.append(Object.assign(document.createElement("h2"), { textContent: title }), ...rows);
    return section;
  }

  function inventoryRow(icon, label, count, onClick = null) {
    const row = onClick ? button("inventory-row", "", onClick, { title: label }) : document.createElement("div");
    if (!onClick) row.className = "inventory-row";
    row.append(img(icon), Object.assign(document.createElement("span"), { textContent: label }), Object.assign(document.createElement("strong"), { textContent: String(count) }));
    return row;
  }

  function bottomTabs(active) {
    const tabs = document.createElement("div");
    tabs.className = "bottom-tabs";
    tabs.append(
      bottomTab("party", "Your Party", "tab_icon_party.png", "tab_icon_party_selected.png", renderParty, active),
      bottomTab("inventory", "Inventory", "tab_icon_inventory.png", "tab_icon_inventory_selected.png", renderInventory, active),
      bottomTab("community", "Community", "tab_icon_community.png", "tab_icon_community_selected.png", renderCommunity, active)
    );
    return tabs;
  }

  function bottomTab(id, label, icon, selectedIcon, target, active) {
    const node = button(`bottom-tab${active === id ? " active" : ""}`, "", target, { title: label });
    node.append(img(active === id ? selectedIcon : icon), Object.assign(document.createElement("span"), { textContent: label }));
    return node;
  }

  function characterName() {
    if (state.character === "male") return "Horn Warden";
    return "illumina";
  }

  function characterPortrait() {
    return state.character === "male" ? "character_male_portrait.png" : "character_female_portrait.png";
  }

  function characterHead() {
    return state.character === "male" ? "character_male_cropped_head.png" : "character_female_cropped_head.png";
  }

  function toolMasteryLevel(id) {
    return Math.max(0, Math.min(8, Number(state.toolMastery[id]) || (state.equipment.includes(id) ? 1 : 0)));
  }

  function essenceMasteryLevel(id) {
    return Math.max(0, (state.mastery[id] || 1) - 1);
  }

  function statRow(icon, label, value) {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.append(img(icon), document.createTextNode(label), document.createTextNode(String(value)));
    return row;
  }

  function renderStore(filter = storeFilter, selectedId = selectedStoreItemId) {
    if (typeof filter !== "string") filter = storeFilter || "tools";
    if (typeof selectedId !== "string") selectedId = selectedStoreItemId;
    setScreen("store");
    storeFilter = filter;
    topBar("Store", renderMap, crystalWallet());

    const shell = document.createElement("div");
    shell.className = "store-shell";

    const tabs = document.createElement("div");
    tabs.className = "store-tabs";
    tabs.append(
      storeTab("tools", "Tools"),
      storeTab("books", "Books"),
      storeTab("owned", "Owned")
    );

    const items = filteredStoreItems(storeFilter);
    if (!items.some((item) => item.id === selectedId)) selectedId = items[0]?.id || null;
    selectedStoreItemId = selectedId;

    const list = document.createElement("div");
    list.className = "store-list";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "notice store-empty";
      empty.textContent = storeFilter === "owned" ? "Nothing purchased yet." : "No wares here.";
      list.append(empty);
    }

    for (const item of items) {
      list.append(storeRow(item, item.id === selectedStoreItemId));
    }

    const layout = document.createElement("div");
    layout.className = "store-layout";
    layout.append(list, storeDetail(storeItems.find((item) => item.id === selectedStoreItemId)));

    shell.append(tabs, layout);
    ui.append(shell, resourceStrip());
  }

  function crystalWallet() {
    const wallet = document.createElement("span");
    wallet.className = "crystal-wallet";
    wallet.append(img("icon_crystals.png"), document.createTextNode(formatCount(state.crystals)));
    return wallet;
  }

  function storeTab(id, label) {
    const node = button(`store-tab${storeFilter === id ? " active" : ""}`, label, () => renderStore(id));
    node.setAttribute("aria-pressed", storeFilter === id ? "true" : "false");
    return node;
  }

  function filteredStoreItems(filter) {
    return storeItems.filter((item) => {
      if (filter === "owned") return isStoreItemOwned(item);
      return storeCategory(item) === filter;
    });
  }

  function storeCategory(item) {
    return item.kind === "magicbook" ? "books" : "tools";
  }

  function isStoreItemOwned(item) {
    return state.owned.includes(item.id);
  }

  function isBlueprintCrafted(item) {
    return item.kind === "blueprint" && state.equipment.includes(item.reward.id);
  }

  function isMagicbookSolved(item) {
    return item.kind === "magicbook" && state.mastery[item.puzzle.mastery] > 1;
  }

  function storeRow(item, selected) {
    const status = storeItemStatus(item);
    const row = button(`item-row store-row ${status.className}${selected ? " selected" : ""}`, "", () => {
      renderStore(storeFilter, item.id);
    }, { title: item.title });
    row.setAttribute("aria-pressed", selected ? "true" : "false");
    row.append(
      img(item.icon, "icon"),
      itemCopy(item.title, storeRowDetail(item)),
      priceNode(status.label, status.icon)
    );
    return row;
  }

  function storeRowDetail(item) {
    if (isBlueprintCrafted(item)) return "Crafted - wild blocks can now drop in the mine.";
    if (isStoreItemOwned(item) && item.kind === "blueprint") return "Purchased - finish the tool in the Smith.";
    if (isStoreItemOwned(item) && item.kind === "magicbook") return "Purchased - solve the puzzle in the Tower.";
    if (!canAfford(item)) return missingCostText(item);
    return item.detail;
  }

  function storeItemStatus(item) {
    if (isBlueprintCrafted(item)) {
      return { label: "Crafted", icon: "icon_blueprint_solved.png", className: "crafted" };
    }
    if (isStoreItemOwned(item) && item.kind === "blueprint") {
      return { label: "Smith", icon: "icon_blueprint.png", className: "owned" };
    }
    if (isStoreItemOwned(item) && item.kind === "magicbook") {
      const studied = isMagicbookSolved(item);
      return {
        label: studied ? "Studied" : "Tower",
        icon: studied ? "icon_magicbook_solved.png" : "icon_magicbook.png",
        className: "owned",
      };
    }
    if (canAfford(item)) return { label: "Buy", icon: "icon_disclosure_buy.png", className: "ready" };
    return { label: "Need", icon: "icon_crystals.png", className: "locked" };
  }

  function storeDetail(item) {
    const panel = document.createElement("div");
    panel.className = "store-detail";

    if (!item) {
      const empty = document.createElement("div");
      empty.className = "notice store-empty";
      empty.textContent = "Choose a shelf.";
      panel.append(empty);
      return panel;
    }

    const header = document.createElement("div");
    header.className = "store-detail-header";
    const copy = document.createElement("div");
    copy.append(
      Object.assign(document.createElement("h2"), { textContent: item.title }),
      Object.assign(document.createElement("p"), { textContent: item.detail })
    );
    header.append(img(item.icon, "store-detail-icon"), copy);

    const meta = document.createElement("div");
    meta.className = "store-meta";
    meta.append(
      storeBadge(item.kind === "blueprint" ? "Blueprint" : "Magicbook"),
      storeBadge(item.kind === "blueprint" ? targetText(item.target, item.time) : towerText(item))
    );

    const costs = document.createElement("div");
    costs.className = "store-costs";
    costs.append(costChip("icon_crystals.png", "Crystals", state.crystals, item.crystalCost));
    for (const [id, amount] of Object.entries(item.resources || {})) {
      costs.append(costChip(resourceById[id].icon, resourceById[id].label, state.resources[id], amount));
    }

    const note = document.createElement("p");
    note.className = "store-note";
    note.textContent = storeDetailNote(item);

    if (isStoreItemOwned(item)) {
      panel.append(header, meta, note, storeAction(item));
    } else {
      panel.append(header, meta, costs, storeAction(item));
    }
    return panel;
  }

  function storeBadge(text) {
    const badge = document.createElement("span");
    badge.className = "store-badge";
    badge.textContent = text;
    return badge;
  }

  function towerText(item) {
    const mastery = item.puzzle.mastery;
    const puzzle = towerPuzzleDefinition(item);
    return `${puzzle.moves} moves, ${puzzle.goal} sigils, ${capitalize(mastery)} +1`;
  }

  function costChip(icon, label, current, required) {
    const chip = document.createElement("span");
    chip.className = `cost-chip${current < required ? " short" : ""}`;
    chip.append(
      img(icon),
      Object.assign(document.createElement("span"), { textContent: label }),
      Object.assign(document.createElement("strong"), { textContent: `${formatCount(current)}/${formatCount(required)}` })
    );
    return chip;
  }

  function storeDetailNote(item) {
    if (isBlueprintCrafted(item)) return `${item.reward.title} is crafted and can appear as a wild block in the mine.`;
    if (isStoreItemOwned(item) && item.kind === "blueprint") return "The pattern is bought. Take it to the Smith and complete its timed essence order.";
    if (isStoreItemOwned(item) && item.kind === "magicbook") return "The book is bought. Open the Tower to solve its move-limited puzzle.";
    if (!canAfford(item)) return missingCostText(item);
    return item.kind === "blueprint"
      ? "Buy the pattern here, then craft the finished tool at the Smith."
      : "Buy the book here, then solve its puzzle in the Tower.";
  }

  function storeAction(item) {
    if (!isStoreItemOwned(item)) {
      return button("stone-btn store-action", canAfford(item) ? "Buy" : "Need More", () => buyItem(item), {
        disabled: !canAfford(item),
      });
    }
    if (item.kind === "blueprint") return button("stone-btn store-action", "Open Smith", renderSmith);
    return button("stone-btn store-action", "Open Tower", renderTower);
  }

  function itemCopy(title, detail) {
    const copy = document.createElement("span");
    copy.className = "item-copy";
    copy.append(
      Object.assign(document.createElement("strong"), { textContent: title }),
      Object.assign(document.createElement("span"), { textContent: detail })
    );
    return copy;
  }

  function priceNode(text, icon = "icon_crystals.png") {
    const node = document.createElement("span");
    node.className = "price";
    node.append(img(icon), document.createTextNode(text));
    return node;
  }

  function priceText(item) {
    const resourceTotal = Object.values(item.resources || {}).reduce((sum, value) => sum + value, 0);
    return String(item.crystalCost + resourceTotal);
  }

  function missingCostText(item) {
    const shortages = [];
    if (state.crystals < item.crystalCost) {
      shortages.push(`${formatCount(item.crystalCost - state.crystals)} crystals`);
    }
    for (const [id, amount] of Object.entries(item.resources || {})) {
      if (state.resources[id] < amount) {
        shortages.push(`${formatCount(amount - state.resources[id])} ${resourceById[id].label.toLowerCase()}`);
      }
    }
    return shortages.length ? `Need ${shortages.join(", ")}.` : "Ready to buy.";
  }

  function canAfford(item) {
    if (state.crystals < item.crystalCost) return false;
    return Object.entries(item.resources || {}).every(([id, amount]) => state.resources[id] >= amount);
  }

  function spendCost(item) {
    state.crystals -= item.crystalCost;
    for (const [id, amount] of Object.entries(item.resources || {})) {
      state.resources[id] -= amount;
    }
  }

  function buyItem(item) {
    if (state.owned.includes(item.id) || !canAfford(item)) return;
    spendCost(item);
    if (!state.owned.includes(item.id)) state.owned.push(item.id);
    if (item.kind === "blueprint" && !state.blueprints.includes(item.id)) state.blueprints.push(item.id);
    if (item.kind === "magicbook" && !state.magicbooks.includes(item.id)) state.magicbooks.push(item.id);
    saveState();
    playSound("complete");
    renderStore(storeFilter, item.id);
  }

  function renderSmith() {
    setScreen("smith");
    topBar("Smith", renderMap);
    const list = document.createElement("div");
    list.className = "menu-list";

    if (!state.blueprints.length) {
      const note = document.createElement("div");
      note.className = "notice";
      note.textContent = "No blueprints.";
      list.append(note);
    }

    for (const id of state.blueprints) {
      const item = storeItems.find((candidate) => candidate.id === id);
      if (!item) continue;
      const crafted = state.equipment.includes(item.reward.id);
      const maxed = crafted && toolMasteryLevel(item.reward.id) >= 8;
      const canForge = !maxed && canStartCraft(item);
      const row = button("item-row", "", () => startCraft(item), {
        disabled: maxed || !canForge,
        title: maxed ? "Mastered" : canForge ? (crafted ? "Upgrade" : "Forge") : "Need essences",
      });
      row.append(
        img(crafted ? item.reward.icon : item.icon, "icon"),
        itemCopy(crafted ? item.reward.title : item.title, smithRowDetail(item, crafted, maxed)),
        priceNode(maxed ? "8/8" : canForge ? (crafted ? `${toolMasteryLevel(item.reward.id)}/8` : "Forge") : "Need", maxed ? "icon_blueprint_solved.png" : "icon_timer.png")
      );
      list.append(row);
    }

    ui.append(list, resourceStrip());
  }

  function renderTower() {
    setScreen("tower");
    topBar("Tower", renderMap);
    const list = document.createElement("div");
    list.className = "menu-list";

    if (!state.magicbooks.length) {
      const note = document.createElement("div");
      note.className = "notice";
      note.textContent = "No magicbooks.";
      list.append(note);
    }

    for (const id of state.magicbooks) {
      const item = storeItems.find((candidate) => candidate.id === id);
      if (!item) continue;
      const mastery = item.puzzle.mastery;
      const solved = isMagicbookSolved(item);
      const row = button("item-row", "", () => startBoard("puzzle", item), {
        disabled: solved,
        title: solved ? "Solved" : "Puzzle",
      });
      row.append(
        img(solved ? "icon_magicbook_solved.png" : item.icon, "icon"),
        itemCopy(item.title, solved ? `${capitalize(mastery)} mastery unlocked.` : `${towerPuzzleDefinition(item).goal} sigils in ${towerPuzzleDefinition(item).moves} moves.`),
        priceNode(solved ? "Done" : `${towerPuzzleDefinition(item).moves}`, solved ? "icon_magicbook_solved.png" : "icon_moves.png")
      );
      list.append(row);
    }

    ui.append(list, resourceStrip());
  }

  function targetText(target, time) {
    const parts = Object.entries(target)
      .filter(([, value]) => value > 0)
      .map(([id, value]) => `${capitalize(id)} ${value}`);
    return `${parts.join(", ")} in ${time}s.`;
  }

  function smithRowDetail(item, crafted, maxed) {
    if (maxed) return "Mastered. Its wild-block effect is at full strength.";
    if (crafted) return `${smithCostText(item)} Then collect ${targetText(smithTarget(item), smithTime(item))}`;
    return `${smithCostText(item)} Then collect ${targetText(smithTarget(item), smithTime(item))}`;
  }

  function smithCostText(item) {
    const cost = smithCost(item);
    const parts = Object.entries(cost)
      .filter(([, amount]) => amount > 0)
      .map(([id, amount]) => `${capitalize(id)} ${amount}`);
    const failures = craftFailureCount(item);
    const crafted = state.equipment.includes(item.reward.id);
    return `${failures ? "Retry" : crafted ? "Upgrade" : "Forge"} cost: ${parts.join(", ")}.`;
  }

  function craftFailureCount(item) {
    return Math.max(0, Number(state.craftFailures[item.id]) || 0);
  }

  function smithCost(item) {
    const attempts = craftFailureCount(item);
    const level = state.equipment.includes(item.reward.id) ? toolMasteryLevel(item.reward.id) : 0;
    const multiplier = 1 + level * 0.52 + attempts * 0.35;
    return Object.fromEntries(
      Object.entries(item.forgeCost || item.target || {}).map(([id, amount]) => [id, Math.ceil(amount * multiplier)])
    );
  }

  function canStartCraft(item) {
    if (state.equipment.includes(item.reward.id) && toolMasteryLevel(item.reward.id) >= 8) return false;
    return Object.entries(smithCost(item)).every(([id, amount]) => state.resources[id] >= amount);
  }

  function smithDifficultyLevel(item) {
    return state.equipment.includes(item.reward.id) ? toolMasteryLevel(item.reward.id) : 0;
  }

  function smithTarget(item) {
    const level = smithDifficultyLevel(item);
    const multiplier = 1 + level * 0.22;
    return Object.fromEntries(
      Object.entries(item.target || {}).map(([id, amount]) => [id, Math.ceil(amount * multiplier)])
    );
  }

  function smithTime(item) {
    const level = smithDifficultyLevel(item);
    return Math.max(72, Math.round((item.time || 120) - level * 6));
  }

  function smithRiseSpeed(item) {
    const level = smithDifficultyLevel(item);
    return 6.1 + level * 0.33;
  }

  function spendSmithCost(item) {
    for (const [id, amount] of Object.entries(smithCost(item))) {
      state.resources[id] -= amount;
    }
  }

  function startCraft(item) {
    if (!item) {
      renderSmith();
      return;
    }
    const upgrade = state.equipment.includes(item.reward.id);
    if (upgrade && toolMasteryLevel(item.reward.id) >= 8) {
      renderSmith();
      return;
    }
    if (!canStartCraft(item)) {
      renderSmith();
      return;
    }
    spendSmithCost(item);
    saveState();
    startBoard("craft", item, { upgrade });
  }

  function startBoard(mode, item = null, options = {}) {
    if (mode === "puzzle" && item && isMagicbookSolved(item)) {
      renderTower();
      return;
    }
    if (mode === "craft" && item?.reward && state.equipment.includes(item.reward.id) && !options.upgrade) {
      renderSmith();
      return;
    }

    stopBoard();
    setScreen(mode === "puzzle" ? "puzzle" : "mine");
    const background =
      mode === "craft"
        ? "hud_background_smithing.png"
        : mode === "puzzle"
          ? "hud_background_alchemy.png"
          : "hud_background_mining.png";
    const border =
      mode === "craft"
        ? "hud_border_smithing.png"
        : mode === "puzzle"
          ? "hud_border_alchemy.png"
          : "hud_border_mining.png";
    const puzzleDefinition = mode === "puzzle" ? towerPuzzleDefinition(item) : null;
    const mineDifficulty = mode === "mine" ? normalizeMineDifficulty(options.difficulty ?? state.mineDifficulty) : null;

    boardGame = {
      mode,
      item,
      mineDifficulty,
      craftUpgrade: Boolean(options.upgrade),
      craftTarget: mode === "craft" ? smithTarget(item) : null,
      puzzleDefinition,
      background,
      border,
      grid: mode === "puzzle" ? createPuzzleGrid(item, puzzleDefinition) : mode === "craft" ? createCraftGrid(item) : createMineGrid(),
      gravity: { ...(mode === "puzzle" ? GRAVITY[puzzleDefinition.gravity] : GRAVITY.down) },
      riseOffset: 0,
      riseSpeed: mode === "mine" ? mineDifficultySettings(mineDifficulty).speed : mode === "craft" ? smithRiseSpeed(item) : 0,
      openingRowsRemaining: mode === "mine" ? MINE_OPENING_ROWS : 0,
      openingRowActive: false,
      openingRowDelay: mode === "mine" ? 0.18 : 0,
      openingRiseSpeed: TILE / 0.22,
      selected: null,
      cursor: mode === "puzzle" ? { row: 2, col: 2 } : { row: 5, col: 2 },
      resolving: 0.2,
      chain: 0,
      score: 0,
      xp: 0,
      crystals: 0,
      gained: emptyResources(0),
      particles: [],
      animations: new Map(),
      pendingSpecials: [],
      matchCheck: 0.12,
      slowTimer: 0,
      timeLeft: mode === "craft" ? smithTime(item) : item?.time || 0,
      movesLeft: puzzleDefinition?.moves || item?.puzzle?.moves || 0,
      puzzleGoal: puzzleDefinition?.goal || item?.puzzle?.goal || 0,
      cleared: 0,
      status: "playing",
      messageTimer: 0,
      message: "",
      comboTimer: 0,
      comboText: "",
    };

    renderCanvasActions(mode);
    lastFrame = performance.now();
    rafId = requestAnimationFrame(loop);
    startMusic(mode);
  }

  function renderCanvasActions(mode) {
    const actions = document.createElement("div");
    actions.className = "canvas-actions";
    actions.append(
      button("mine-back-btn", "Map", () => {
        commitBoardGains(false);
        renderMap();
      }, { title: "Back to map" })
    );
    if (mode !== "puzzle" && mode !== "mine") {
      actions.append(button("small-btn", "Pull", pullRow, { title: "Pull row" }));
    } else if (mode === "puzzle") {
      actions.append(document.createElement("span"));
    }
    if (mode !== "mine") actions.append(soundButton());
    ui.append(actions);

    ui.append(tiltControls());
  }

  function soundButton() {
    const node = button("small-btn sound-btn", "", toggleAudio, { title: "Toggle sound" });
    node.dataset.soundToggle = "true";
    updateSoundButtons(node);
    return node;
  }

  function updateSoundButtons(root = ui) {
    const buttons = root.matches?.("[data-sound-toggle]") ? [root] : [...root.querySelectorAll("[data-sound-toggle]")];
    for (const node of buttons) {
      node.textContent = audioSettings.muted ? "Muted" : "Sound";
      node.title = audioSettings.muted ? "Turn sound on" : "Mute sound";
    }
  }

  function tiltControls() {
    const controls = document.createElement("div");
    controls.className = "tilt-controls";
    controls.append(
      tiltButton("up", "U"),
      tiltButton("left", "L"),
      tiltButton("right", "R"),
      tiltButton("down", "D"),
      button("tilt-btn sensor", "T", enableTiltSensors, { title: "Use device tilt" })
    );
    updateTiltControls(controls);
    return controls;
  }

  function tiltButton(directionName, label) {
    const node = button(`tilt-btn ${directionName}`, label, () => setGravity(directionName), {
      title: `Tilt ${directionName}`,
    });
    node.dataset.gravity = directionName;
    return node;
  }

  function updateTiltControls(root = ui) {
    if (!boardGame) return;
    root.querySelectorAll(".tilt-btn[data-gravity]").forEach((node) => {
      node.classList.toggle("active", isCurrentGravity(node.dataset.gravity));
    });
  }

  function isCurrentGravity(directionName) {
    const direction = GRAVITY[directionName];
    return Boolean(
      direction &&
        boardGame.gravity &&
        direction.row === boardGame.gravity.row &&
        direction.col === boardGame.gravity.col
    );
  }

  function stopBoard() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    stopMusic();
    boardGame = null;
  }

  function gridColCount() {
    return boardGame?.grid?.[0]?.length || COLS;
  }

  function boardMetrics() {
    if (boardGame?.mode === "puzzle") {
      const columns = gridColCount();
      const rows = boardGame.grid.length;
      const width = columns * PUZZLE_TILE;
      const height = rows * PUZZLE_TILE;
      return {
        rowStart: 0,
        rowEnd: rows - 1,
        colStart: 0,
        colEnd: columns - 1,
        rows,
        columns,
        cellW: PUZZLE_TILE,
        cellH: PUZZLE_TILE,
        x: (W - width) / 2,
        y: H - height - 28,
        width,
        height,
      };
    }

    return {
      rowStart: 0,
      rowEnd: VISIBLE_ROWS - 1,
      colStart: 0,
      colEnd: COLS - 1,
      rows: VISIBLE_ROWS,
      columns: COLS,
      cellW: TILE,
      cellH: TILE,
      x: BOARD_X,
      y: BOARD_Y,
      width: BOARD_W,
      height: BOARD_H,
    };
  }

  function clampCursorToView() {
    const metrics = boardMetrics();
    boardGame.cursor.row = Math.max(metrics.rowStart, Math.min(metrics.rowEnd, boardGame.cursor.row));
    boardGame.cursor.col = Math.max(metrics.colStart, Math.min(metrics.colEnd, boardGame.cursor.col));
  }

  function createMineGrid() {
    return Array.from({ length: GRID_ROWS }, () => Array(COLS).fill(null));
  }

  function createCraftGrid(item) {
    const grid = Array.from({ length: GRID_ROWS }, () => Array(COLS).fill(null));
    const pool = craftResourcePool(item);
    for (let r = 2; r < GRID_ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        grid[r][c] = randomCell(grid, r, c, { pool, specials: false });
      }
    }
    return grid;
  }

  function createPuzzleGrid(item, definition = towerPuzzleDefinition(item)) {
    const charMap = towerPuzzleResourceMap(item?.puzzle?.mastery || "earth");
    const runeCells = new Set(definition.runes);

    return definition.layout.map((line, row) => {
      return [...line].map((char, col) => {
        if (char === ".") return null;
        return makeCell(charMap[char], { rune: runeCells.has(`${row},${col}`) });
      });
    });
  }

  function towerPuzzleDefinition(item) {
    const mastery = item?.puzzle?.mastery || "earth";
    return towerPuzzleLayouts[mastery] || towerPuzzleLayouts.earth;
  }

  function towerPuzzleResourceMap(mastery) {
    const ordered = [
      mastery,
      ...resourceTypes.map((type) => type.id).filter((id) => id !== mastery),
    ];
    return {
      E: ordered[0],
      F: ordered[1],
      A: ordered[2],
      N: ordered[3],
      S: ordered[4],
      C: ordered[2],
    };
  }

  function randomCell(grid, row, col, options = {}) {
    const special = options.specials === false ? null : randomSpecialType();
    if (special) return makeCell(special);

    const pool = [...(options.pool || resourceTypes.map((type) => type.id))];

    for (let tries = 0; tries < 16; tries += 1) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      if (!wouldMatch(grid, row, col, type)) return makeCell(type);
    }
    return makeCell(pool[Math.floor(Math.random() * pool.length)]);
  }

  function randomSpecialType() {
    const pool = [];
    if (state.equipment.includes("dreameater-tool")) pool.push("compass");
    if (state.equipment.includes("watchmaker-loop")) pool.push("watch");
    if (state.equipment.includes("alchemist-joker")) pool.push("potion");
    if (state.equipment.includes("redhot-coal")) pool.push("coal");
    if (state.equipment.includes("hammer-2x")) pool.push("hammer2");
    if (state.equipment.includes("hammer-3x")) pool.push("hammer3");
    if (!pool.length) return null;

    const masteryBoost = pool.reduce((sum, type) => sum + specialMasteryLevel(type), 0) * 0.0012;
    const chance = Math.min(0.12, 0.03 + pool.length * 0.008 + masteryBoost);
    if (Math.random() > chance) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function wouldMatch(grid, row, col, type) {
    const left1 = grid[row]?.[col - 1]?.type;
    const left2 = grid[row]?.[col - 2]?.type;
    const up1 = grid[row - 1]?.[col]?.type;
    const up2 = grid[row - 2]?.[col]?.type;
    return (left1 === type && left2 === type) || (up1 === type && up2 === type);
  }

  function makeRisingRow(targetRowIndex = boardGame?.grid?.length || 0) {
    const row = Array(COLS).fill(null);
    const pool = boardGame?.mode === "craft" ? craftResourcePool(boardGame.item) : null;
    const context = boardGame?.grid ? boardGame.grid.map((gridRow) => gridRow.slice()) : [];
    const rowIndex = targetRowIndex;
    while (context.length <= rowIndex) context.push(Array(COLS).fill(null));
    context[rowIndex] = row;
    for (let c = 0; c < COLS; c += 1) {
      row[c] = randomCell(context, rowIndex, c, pool ? { pool, specials: false } : {});
      context[rowIndex][c] = row[c];
    }
    return row;
  }

  function craftResourcePool(item) {
    const required = Object.keys(item?.target || {});
    const pool = [];
    for (const id of required) {
      pool.push(id, id, id, id);
    }
    for (const type of resourceTypes) {
      pool.push(type.id);
    }
    return pool;
  }

  function loop(now) {
    if (!boardGame) return;
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    updateBoard(dt);
    drawBoard();
    rafId = requestAnimationFrame(loop);
  }

  function updateBoard(dt) {
    if (!boardGame || boardGame.status !== "playing") return;

    if (boardGame.mode === "craft") {
      boardGame.timeLeft -= dt;
      if (boardGame.timeLeft <= 0) {
        finishBoard(false, "Time Up", "The blueprint fizzled before the last essence landed.");
        return;
      }
    }

    if (boardGame.slowTimer > 0) boardGame.slowTimer -= dt;
    if (boardGame.messageTimer > 0) boardGame.messageTimer -= dt;
    if (boardGame.comboTimer > 0) boardGame.comboTimer -= dt;
    updateCellBoosts(dt);
    clampCursorToView();

    if (updateMineOpening(dt)) {
      updateParticles(dt);
      return;
    }

    if (updateAnimations(dt)) {
      return;
    }

    if (boardGame.resolving > 0) {
      boardGame.resolving -= dt;
      if (boardGame.resolving <= 0) resolveMatches();
    } else {
      if (settleBoard()) return;

      boardGame.matchCheck -= dt;
      if (boardGame.matchCheck <= 0) {
        if (!isBoardStable()) {
          settleBoard(true);
          return;
        }
        const matches = findMatches();
        boardGame.matchCheck = 0.12;
        if (matches.size) {
          resolveMatches(matches);
          return;
        }
      }
    }

    if (boardGame.resolving <= 0 && boardGame.riseSpeed > 0) {
      const speed = boardGame.slowTimer > 0 ? boardGame.riseSpeed * 0.28 : boardGame.riseSpeed;
      boardGame.riseOffset += speed * dt;
      if (boardGame.riseOffset >= TILE) {
        advanceRows();
      }
    }

    updateParticles(dt);
  }

  function updateParticles(dt) {
    for (const particle of boardGame.particles) {
      particle.life -= dt;
      particle.y -= particle.speed * dt;
    }
    boardGame.particles = boardGame.particles.filter((particle) => particle.life > 0);
  }

  function updateMineOpening(dt) {
    if (!isMineOpening()) return false;

    if (!boardGame.openingRowActive) {
      boardGame.openingRowDelay -= dt;
      if (boardGame.openingRowDelay > 0) return true;
      boardGame.grid[GRID_ROWS - 1] = makeRisingRow(GRID_ROWS - 1);
      boardGame.openingRowActive = true;
      playSound("fall");
    }

    boardGame.riseOffset += boardGame.openingRiseSpeed * dt;
    if (boardGame.riseOffset >= TILE) {
      boardGame.riseOffset -= TILE;
      boardGame.grid.shift();
      boardGame.openingRowsRemaining -= 1;
      boardGame.openingRowActive = false;
      boardGame.grid.push(
        boardGame.openingRowsRemaining === 0 ? makeRisingRow() : Array(COLS).fill(null)
      );
      boardGame.openingRowDelay = boardGame.openingRowsRemaining > 0 ? 0.12 : 0;
      if (boardGame.openingRowsRemaining === 0) {
        boardGame.resolving = 0.12;
        boardGame.matchCheck = 0.05;
      }
    }

    return true;
  }

  function isMineOpening() {
    return Boolean(
      boardGame?.mode === "mine" &&
        (boardGame.openingRowsRemaining > 0 || boardGame.openingRowActive || boardGame.openingRowDelay > 0)
    );
  }

  function pullRow() {
    if (!boardGame || boardGame.status !== "playing" || boardGame.mode === "puzzle" || isMineOpening()) return;
    boardGame.riseOffset += TILE * 0.88;
    boardGame.message = "Pull";
    boardGame.messageTimer = 0.65;
    playSound("pull");
    while (boardGame.riseOffset >= TILE && boardGame.status === "playing") {
      advanceRows();
    }
  }

  function setGravity(directionName) {
    if (!boardGame || boardGame.status !== "playing") return;
    if (isMineOpening()) return;
    const next = GRAVITY[directionName];
    if (!next) return;

    const changed = boardGame.gravity.row !== next.row || boardGame.gravity.col !== next.col;
    if (!changed) return;
    if (boardGame.mode === "puzzle" && !spendPuzzleMove("The last tilt slipped away before every sigil was cleared.")) {
      return;
    }
    boardGame.gravity = { ...next };
    boardGame.message = `Tilt ${next.label}`;
    boardGame.messageTimer = 0.55;
    playSound("tilt");
    updateTiltControls();

    const settled = settleBoard(true);
    clampCursorToView();
    if (!settled && !boardGame.animations.size) {
      boardGame.resolving = 0;
      resolveMatches();
    }
  }

  function enableTiltSensors() {
    if (tiltSensorEnabled) {
      boardGame.message = "Tilt On";
      boardGame.messageTimer = 0.6;
      return;
    }

    const attach = () => {
      window.addEventListener("deviceorientation", handleDeviceTilt);
      tiltSensorEnabled = true;
      if (boardGame) {
        boardGame.message = "Tilt On";
        boardGame.messageTimer = 0.6;
      }
    };

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === "granted") attach();
        })
        .catch(() => {
          if (boardGame) {
            boardGame.message = "Tilt Off";
            boardGame.messageTimer = 0.6;
          }
        });
    } else if (typeof DeviceOrientationEvent !== "undefined") {
      attach();
    }
  }

  function handleDeviceTilt(event) {
    if (!boardGame || boardGame.status !== "playing") return;
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;
    const threshold = 18;
    if (Math.max(Math.abs(beta), Math.abs(gamma)) < threshold) return;

    if (boardGame.mode === "puzzle") {
      const now = performance.now();
      if (now - lastSensorTiltAt < 800) return;
      lastSensorTiltAt = now;
    }

    if (Math.abs(gamma) > Math.abs(beta)) {
      setGravity(gamma > 0 ? "right" : "left");
    } else {
      setGravity(beta > 0 ? "down" : "up");
    }
  }

  function updateCellBoosts(dt) {
    for (const row of boardGame.grid) {
      for (const cell of row) {
        if (!cell?.boostTimer) continue;
        cell.boostTimer -= dt;
        if (cell.boostTimer <= 0) {
          delete cell.boost;
          delete cell.boostTimer;
        }
      }
    }
  }

  function updateAnimations(dt) {
    if (!boardGame.animations.size) return false;

    for (const [id, animation] of boardGame.animations) {
      animation.elapsed += dt;
      if (animation.elapsed >= animation.duration) {
        boardGame.animations.delete(id);
      }
    }

    if (!boardGame.animations.size) {
      if (boardGame.pendingSpecials.length) {
        activatePendingSpecials();
        settleBoard(true);
        boardGame.matchCheck = 0.03;
        boardGame.resolving = Math.max(boardGame.resolving, 0.05);
        return true;
      }
      if (!isBoardStable()) {
        settleBoard(true);
        return true;
      }
      boardGame.matchCheck = 0.02;
      boardGame.resolving = Math.max(boardGame.resolving, 0.02);
    }

    return true;
  }

  function advanceRows() {
    boardGame.riseOffset -= TILE;
    const removed = boardGame.grid.shift();
    if (removed.some(Boolean)) {
      playSound("danger");
      finishBoard(false, "Mine Collapsed", "The block line reached the roof.");
      return;
    }
    boardGame.grid.push(makeRisingRow());

    if (!settleBoard(true)) {
      boardGame.resolving = Math.max(boardGame.resolving, 0.08);
    }
  }

  function resolveMatches(matches = findMatches()) {
    if (!isBoardStable()) {
      settleBoard(true);
      return;
    }

    if (!matches.size) {
      boardGame.chain = 0;
      if (boardGame.mode === "craft" && targetMet(boardGame.gained, boardGame.craftTarget)) {
        completeCraft();
      }
      if (boardGame.mode === "puzzle") {
        if (boardGame.cleared >= boardGame.puzzleGoal) {
          completePuzzle();
        } else if (boardGame.movesLeft <= 0) {
          finishBoard(false, "Puzzle Sealed", "The last orb move faded before every sigil was cleared.");
        }
      }
      return;
    }

    const multiplier = Math.min(5, boardGame.chain + 1);
    const clearedCells = [];
    for (const key of matches) {
      const [row, col] = key.split(",").map(Number);
      const cell = boardGame.grid[row]?.[col];
      if (!cell) continue;
      clearedCells.push({ row, col, cell });
      boardGame.grid[row][col] = null;
    }

    for (const { row, col, cell } of clearedCells) {
      collectCell(cell, multiplier, row, col);
    }

    state.stats.mostBlocksPopped = Math.max(state.stats.mostBlocksPopped, clearedCells.length);
    state.stats.longestChain = Math.max(state.stats.longestChain, boardGame.chain + 1);
    saveState();
    playSound("pop", { multiplier, count: clearedCells.length });
    showCombo(multiplier, clearedCells.length);
    settleBoard(true);
    boardGame.chain += 1;
    boardGame.resolving = 0.18;
  }

  function showCombo(multiplier, clearedCount) {
    if (boardGame.mode === "puzzle") {
      boardGame.comboText = multiplier > 1 ? `Chain x${multiplier}` : `Sigils ${boardGame.cleared}/${boardGame.puzzleGoal}`;
      boardGame.comboTimer = 1.15;
      return;
    }
    if (multiplier <= 1 && clearedCount < 4) return;
    state.stats.largestCombo = Math.max(state.stats.largestCombo, multiplier);
    const crystalBonus = Math.max(0, multiplier - 1);
    if (crystalBonus) {
      boardGame.crystals += crystalBonus;
      state.crystals += crystalBonus;
    }
    boardGame.comboText = multiplier > 1 ? `Combo x${multiplier}` : `Match ${clearedCount}`;
    boardGame.comboTimer = 1.15;
    saveState();
  }

  function findMatches() {
    const matched = new Set();
    const columns = gridColCount();

    for (let r = 0; r < boardGame.grid.length; r += 1) {
      let runType = null;
      let runStart = 0;
      let runLength = 0;
      for (let c = 0; c <= columns; c += 1) {
        const type = c < columns ? matchType(boardGame.grid[r][c]) : null;
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

    for (let c = 0; c < columns; c += 1) {
      let runType = null;
      let runStart = 0;
      let runLength = 0;
      for (let r = 0; r <= boardGame.grid.length; r += 1) {
        const type = r < boardGame.grid.length ? matchType(boardGame.grid[r][c]) : null;
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

  function matchType(cell) {
    if (!cell || specialTypes.has(cell.type)) return null;
    return cell.type;
  }

  function collectCell(cell, multiplier, row, col, partnerType = null) {
    const resource = resourceById[cell.type];
    const value = 1 + essenceMasteryLevel(cell.type);
    if (resource) {
      if (boardGame.mode === "puzzle") {
        if (cell.rune) boardGame.cleared += 1;
        boardGame.score += (cell.rune ? 120 : 30) * multiplier;
      } else {
        const boost = cell.boost || 1;
        const amount = value * multiplier * boost;
        boardGame.gained[cell.type] += amount;
        state.resources[cell.type] += amount;
        boardGame.xp += amount;
        boardGame.score += amount * 25;
        state.xp += amount;
        boardGame.cleared += 1;
      }
    } else if (specialTypes.has(cell.type)) {
      applySpecialEffect(cell.type, row, col, partnerType, multiplier);
    }

    if (boardGame.mode !== "puzzle" && Math.random() < 0.34) {
      const crystals = multiplier;
      boardGame.crystals += crystals;
      state.crystals += crystals;
    }

    boardGame.particles.push({
      ...particlePosition(row, col),
      color: resource?.color || specialBlocks[cell.type]?.color || "#ffd56a",
      life: 0.48,
      speed: 32 + Math.random() * 24,
    });

    while (boardGame.mode !== "puzzle" && state.xp >= xpNeeded()) {
      state.xp -= xpNeeded();
      state.level += 1;
      state.crystals += 35;
      boardGame.message = "Level Up";
      boardGame.messageTimer = 1.2;
    }

    saveState();
  }

  function applySpecialEffect(type, row, col, partnerType = null, multiplier = 1) {
    const block = specialBlocks[type];
    if (!block) return;
    const mastery = specialMasteryLevel(type);

    playSound("wild", { type });
    boardGame.score += (150 + mastery * 18) * multiplier;
    boardGame.message = mastery > 1 ? `${block.label} ${mastery}` : block.label;
    boardGame.messageTimer = 0.9;

    if (type === "compass") {
      clearAround(row, col, multiplier, mastery >= 5 ? 2 : 1);
    } else if (type === "watch") {
      boardGame.slowTimer = Math.max(boardGame.slowTimer, 5 + mastery * 0.85);
    } else if (type === "potion") {
      const targetType = resourceById[partnerType] ? partnerType : strongestNeighborType(row, col);
      if (targetType) clearColor(targetType, multiplier + Math.floor(mastery / 4));
    } else if (type === "coal") {
      clearInGravityDirection(row, col, 2 + Math.ceil(mastery / 2), multiplier);
    } else if (type === "hammer2" || type === "hammer3") {
      boostAround(row, col, (block.boost || 2) + Math.floor(mastery / 4), mastery >= 5 ? 2 : 1);
    }
  }

  function specialMasteryLevel(specialType) {
    const tool = toolMasteryBySpecial[specialType];
    return tool ? toolMasteryLevel(tool.id) : 0;
  }

  function activatePendingSpecials() {
    const pending = boardGame.pendingSpecials.splice(0);
    for (const action of pending) {
      const cell = boardGame.grid[action.row]?.[action.col];
      if (!cell || cell.id !== action.cellId || !specialTypes.has(cell.type)) continue;
      boardGame.grid[action.row][action.col] = null;
      collectCell(cell, 1, action.row, action.col, action.partnerType);
    }
  }

  function clearAround(row, col, multiplier = 1, radius = 1) {
    for (let r = row - radius; r <= row + radius; r += 1) {
      for (let c = col - radius; c <= col + radius; c += 1) {
        removeCellAt(r, c, multiplier, row, col);
      }
    }
  }

  function clearColor(type, multiplier = 1) {
    for (let r = 0; r < boardGame.grid.length; r += 1) {
      for (let c = 0; c < gridColCount(); c += 1) {
        const cell = boardGame.grid[r][c];
        if (cell?.type === type) removeCellAt(r, c, multiplier);
      }
    }
  }

  function clearInGravityDirection(row, col, count, multiplier = 1) {
    const gravity = boardGame.gravity || GRAVITY.down;
    for (let step = 1; step <= count; step += 1) {
      removeCellAt(row + gravity.row * step, col + gravity.col * step, multiplier);
    }
  }

  function boostAround(row, col, boost, radius = 1) {
    for (let r = row - radius; r <= row + radius; r += 1) {
      for (let c = col - radius; c <= col + radius; c += 1) {
        if (r < 0 || c < 0 || r >= boardGame.grid.length || c >= gridColCount()) continue;
        if (r === row && c === col) continue;
        const cell = boardGame.grid[r][c];
        if (!cell || !resourceById[cell.type]) continue;
        cell.boost = Math.max(cell.boost || 1, boost);
        cell.boostTimer = 3;
      }
    }
  }

  function strongestNeighborType(row, col) {
    const counts = {};
    for (let r = row - 1; r <= row + 1; r += 1) {
      for (let c = col - 1; c <= col + 1; c += 1) {
        const type = boardGame.grid[r]?.[c]?.type;
        if (resourceById[type]) counts[type] = (counts[type] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }

  function removeCellAt(row, col, multiplier = 1, skipRow = null, skipCol = null) {
    if (row < 0 || col < 0 || row >= boardGame.grid.length || col >= gridColCount()) return false;
    if (row === skipRow && col === skipCol) return false;
    const cell = boardGame.grid[row][col];
    if (!cell) return false;
    boardGame.grid[row][col] = null;
    collectCell(cell, multiplier, row, col);
    return true;
  }

  function applyGravity() {
    const gravity = boardGame.gravity || GRAVITY.down;
    const previousPositions = currentCellPositions();
    const columns = gridColCount();
    let moved = false;

    if (gravity.col === 0) {
      const rows = gravity.row > 0 ? descendingIndexes(boardGame.grid.length) : ascendingIndexes(boardGame.grid.length);
      for (let c = 0; c < columns; c += 1) {
        const stack = rows.map((r) => boardGame.grid[r][c]).filter(Boolean);
        for (let i = 0; i < rows.length; i += 1) {
          const r = rows[i];
          const next = stack[i] || null;
          if (boardGame.grid[r][c] !== next) {
            moved = true;
            queueGravityAnimation(next, previousPositions, r, c);
          }
          boardGame.grid[r][c] = next;
        }
      }
    } else {
      const cols = gravity.col > 0 ? descendingIndexes(columns) : ascendingIndexes(columns);
      for (let r = 0; r < boardGame.grid.length; r += 1) {
        const stack = cols.map((c) => boardGame.grid[r][c]).filter(Boolean);
        for (let i = 0; i < cols.length; i += 1) {
          const c = cols[i];
          const next = stack[i] || null;
          if (boardGame.grid[r][c] !== next) {
            moved = true;
            queueGravityAnimation(next, previousPositions, r, c);
          }
          boardGame.grid[r][c] = next;
        }
      }
    }

    if (moved) playSound("fall");
    return moved;
  }

  function isBoardStable() {
    const gravity = boardGame.gravity || GRAVITY.down;
    const columns = gridColCount();

    if (gravity.col === 0) {
      const rows = gravity.row > 0 ? descendingIndexes(boardGame.grid.length) : ascendingIndexes(boardGame.grid.length);
      for (let c = 0; c < columns; c += 1) {
        let foundGap = false;
        for (const r of rows) {
          const hasCell = Boolean(boardGame.grid[r][c]);
          if (!hasCell) foundGap = true;
          else if (foundGap) return false;
        }
      }
    } else {
      const cols = gravity.col > 0 ? descendingIndexes(columns) : ascendingIndexes(columns);
      for (let r = 0; r < boardGame.grid.length; r += 1) {
        let foundGap = false;
        for (const c of cols) {
          const hasCell = Boolean(boardGame.grid[r][c]);
          if (!hasCell) foundGap = true;
          else if (foundGap) return false;
        }
      }
    }

    return true;
  }

  function currentCellPositions() {
    const positions = new Map();
    for (let r = 0; r < boardGame.grid.length; r += 1) {
      for (let c = 0; c < gridColCount(); c += 1) {
        const cell = boardGame.grid[r][c];
        if (cell) positions.set(cell.id, { row: r, col: c });
      }
    }
    return positions;
  }

  function queueGravityAnimation(cell, previousPositions, toRow, toCol) {
    if (!cell) return;
    const active = boardGame.animations.get(cell.id);
    const from = active ? animationCurrentGridPosition(active) : previousPositions.get(cell.id);
    if (!from || (from.row === toRow && from.col === toCol)) return;

    const distance = Math.abs(from.row - toRow) + Math.abs(from.col - toCol);
    const duration = Math.min(0.34, 0.1 + distance * 0.035);
    boardGame.animations.set(cell.id, {
      fromRow: from.row,
      fromCol: from.col,
      toRow,
      toCol,
      elapsed: 0,
      duration,
    });
  }

  function animationCurrentGridPosition(animation) {
    const t = Math.min(1, animation.elapsed / animation.duration);
    const eased = 1 - Math.pow(1 - t, 3);
    return {
      row: animation.fromRow + (animation.toRow - animation.fromRow) * eased,
      col: animation.fromCol + (animation.toCol - animation.fromCol) * eased,
    };
  }

  function settleBoard(force = false) {
    if (!force && boardGame.animations.size) return false;
    if (!applyGravity()) return false;
    boardGame.matchCheck = 0.04;
    boardGame.resolving = Math.max(boardGame.resolving, 0.08);
    return true;
  }

  function ascendingIndexes(length) {
    return Array.from({ length }, (_, index) => index);
  }

  function descendingIndexes(length) {
    return Array.from({ length }, (_, index) => length - 1 - index);
  }

  function targetMet(gained, target) {
    return Object.entries(target || {}).every(([id, amount]) => gained[id] >= amount);
  }

  function completeCraft() {
    const reward = boardGame.item.reward;
    const wasUpgrade = boardGame.craftUpgrade && state.equipment.includes(reward.id);
    if (!state.equipment.includes(reward.id)) state.equipment.push(reward.id);
    const nextLevel = wasUpgrade ? toolMasteryLevel(reward.id) + 1 : Math.max(toolMasteryLevel(reward.id), 1);
    state.toolMastery[reward.id] = Math.min(8, nextLevel);
    delete state.craftFailures[boardGame.item.id];
    saveState();
    finishBoard(
      true,
      wasUpgrade ? "Tool Mastery" : "Blueprint Complete",
      wasUpgrade ? `${reward.title} reached level ${state.toolMastery[reward.id]}.` : `${reward.title} is ready.`
    );
  }

  function completePuzzle() {
    const mastery = boardGame.item.puzzle.mastery;
    if (!isMagicbookSolved(boardGame.item)) state.mastery[mastery] += 1;
    saveState();
    finishBoard(true, "Orb Puzzle Solved", `${capitalize(mastery)} mastery unlocked.`);
  }

  function finishBoard(won, title, message) {
    if (!boardGame || boardGame.status !== "playing") return;
    boardGame.status = won ? "won" : "lost";
    if (!won && boardGame.mode === "craft" && boardGame.item) {
      state.craftFailures[boardGame.item.id] = craftFailureCount(boardGame.item) + 1;
      saveState();
    }
    playSound(won ? "complete" : "fail");
    stopMusic();
    commitBoardGains(true);
    showBoardModal(title, message);
  }

  function commitBoardGains() {
    saveState();
  }

  function showBoardModal(title, message) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    const modal = document.createElement("div");
    modal.className = "modal";
    const gainedText = resourceTypes
      .filter((type) => boardGame.gained[type.id] > 0)
      .map((type) => `${capitalize(type.id)} ${boardGame.gained[type.id]}`)
      .join(", ");
    const isSolvedChallenge =
      boardGame.status === "won" && (boardGame.mode === "puzzle" || boardGame.mode === "craft");
    const actionTarget = boardGame.mode === "puzzle" ? renderTower : boardGame.mode === "craft" ? renderSmith : renderMap;
    const actionLabel = boardGame.mode === "puzzle" ? "Tower" : boardGame.mode === "craft" ? "Smith" : "Map";
    const modalNodes = [
      Object.assign(document.createElement("h2"), { textContent: title }),
      Object.assign(document.createElement("p"), {
        textContent: gainedText ? `${message} ${gainedText}.` : message,
      }),
      button("stone-btn", actionLabel, actionTarget),
    ];

    if (!isSolvedChallenge) {
      modalNodes.push(button("small-btn", "Again", () => {
        const mode = boardGame.mode;
        const item = boardGame.item;
        if (mode === "craft") startCraft(item);
        else startBoard(mode, item);
      }));
    }

    modal.append(...modalNodes);
    backdrop.append(modal);
    ui.append(backdrop);
  }

  function drawBoard() {
    if (!boardGame) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#020303";
    ctx.fillRect(0, 0, W, H);
    drawImage(boardGame.background, 9, 101, 302, 349);
    drawGrid();
    drawParticles();
    drawGravityCue();
    if (boardGame.mode !== "mine") drawImage(boardGame.border, 0, 0, W, H);
    drawHud();
  }

  function drawImage(name, x, y, w, h) {
    const image = images[name];
    if (image && image.complete && image.naturalWidth) ctx.drawImage(image, x, y, w, h);
  }

  function drawGrid() {
    const metrics = boardMetrics();
    if (boardGame.mode === "puzzle") drawPuzzleOrbWell(metrics);
    ctx.save();
    ctx.beginPath();
    const clipPad = boardGame.mode === "puzzle" ? 16 : 0;
    ctx.rect(metrics.x - clipPad, metrics.y - clipPad, metrics.width + clipPad * 2, metrics.height + clipPad * 2);
    ctx.clip();

    for (let r = 0; r < boardGame.grid.length; r += 1) {
      for (let c = 0; c < gridColCount(); c += 1) {
        const cell = boardGame.grid[r][c];
        if (!cell) continue;
        const position = visualCellPosition(cell, r, c);
        const x = position.x;
        const y = position.y;
        if (
          x > metrics.x + metrics.width ||
          x + metrics.cellW < metrics.x ||
          y > metrics.y + metrics.height ||
          y + metrics.cellH < metrics.y
        ) {
          continue;
        }
        drawCell(cell, x, y, r, c, metrics.cellW, metrics.cellH);
      }
    }

    ctx.restore();
  }

  function visualCellPosition(cell, row, col) {
    const metrics = boardMetrics();
    const offset = creepOffset(metrics);
    const animation = boardGame.animations.get(cell.id);
    if (!animation) {
      return {
        x: metrics.x + (col - metrics.colStart) * metrics.cellW + offset.x,
        y: metrics.y + (row - metrics.rowStart) * metrics.cellH + offset.y,
      };
    }

    const current = animationCurrentGridPosition(animation);
    return {
      x: metrics.x + (current.col - metrics.colStart) * metrics.cellW + offset.x,
      y: metrics.y + (current.row - metrics.rowStart) * metrics.cellH + offset.y,
    };
  }

  function drawCell(cell, x, y, row, col, width = TILE, height = TILE) {
    if (boardGame.mode === "puzzle") {
      drawOrbCell(cell, x, y, row, col, width, height);
      return;
    }

    const name = cellImage(cell);
    drawImage(name, x, y, width, height);
    if (cell.boost > 1) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 226, 126, 0.72)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5.5, y + 5.5, width - 11, height - 11);
      ctx.fillStyle = "#fff0a8";
      ctx.font = "bold 12px Georgia, serif";
      ctx.textAlign = "right";
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 4;
      ctx.fillText(`x${cell.boost}`, x + width - 7, y + height - 8);
      ctx.restore();
    }
    if (boardGame.selected && boardGame.selected.row === row && boardGame.selected.col === col) {
      drawImage("elemental_block_glow.png", x - width * 0.48, y - height * 0.48, width * 1.95, height * 1.95);
    }
  }

  function drawPuzzleOrbWell(metrics) {
    const pad = 11;
    const x = metrics.x - pad;
    const y = metrics.y - pad;
    const width = metrics.width + pad * 2;
    const height = metrics.height + pad * 2;

    ctx.save();
    const glow = ctx.createRadialGradient(W / 2, y + height * 0.55, 18, W / 2, y + height * 0.58, width * 0.72);
    glow.addColorStop(0, "rgba(104, 205, 116, 0.28)");
    glow.addColorStop(0.55, "rgba(62, 151, 101, 0.12)");
    glow.addColorStop(1, "rgba(4, 8, 7, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 20, y - 20, width + 40, height + 42);

    ctx.fillStyle = "rgba(2, 4, 4, 0.32)";
    ctx.fillRect(x, y + height * 0.12, width, height * 0.82);
    ctx.restore();
  }

  function drawOrbCell(cell, x, y, row, col, width, height) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const radius = Math.min(width, height) * 0.43;
    const resource = resourceById[cell.type];

    ctx.save();
    if (cell.rune) {
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.25, cx, cy, radius * 1.25);
      glow.addColorStop(0, `${resource?.color || "#d8ff9b"}66`);
      glow.addColorStop(1, "rgba(119, 235, 137, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
    ctx.beginPath();
    ctx.ellipse(cx, y + height * 0.82, radius * 0.85, radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    const imageSize = Math.min(width, height) * 0.96;
    drawImage(cellImage(cell), cx - imageSize / 2, cy - imageSize / 2, imageSize, imageSize);

    if (cell.rune) {
      ctx.strokeStyle = "rgba(209, 255, 165, 0.78)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.97, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (boardGame.selected && boardGame.selected.row === row && boardGame.selected.col === col) {
      ctx.strokeStyle = "rgba(255, 239, 167, 0.95)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.08, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function creepOffset(metrics = boardMetrics()) {
    const progress = boardGame.riseOffset / TILE;
    return {
      x: 0,
      y: -progress * metrics.cellH,
    };
  }

  function particlePosition(row, col) {
    const metrics = boardMetrics();
    const offset = creepOffset(metrics);
    return {
      x: metrics.x + (col - metrics.colStart) * metrics.cellW + offset.x + metrics.cellW / 2,
      y: metrics.y + (row - metrics.rowStart) * metrics.cellH + offset.y + metrics.cellH / 2,
    };
  }

  function drawGravityCue() {
    if (!boardGame.gravity) return;
    const metrics = boardMetrics();

    ctx.save();
    ctx.beginPath();
    ctx.rect(metrics.x, metrics.y, metrics.width, metrics.height);
    ctx.clip();

    let gradient;
    if (boardGame.gravity.row > 0) {
      gradient = ctx.createLinearGradient(0, metrics.y + metrics.height - 92, 0, metrics.y + metrics.height);
    } else if (boardGame.gravity.row < 0) {
      gradient = ctx.createLinearGradient(0, metrics.y + 92, 0, metrics.y);
    } else if (boardGame.gravity.col > 0) {
      gradient = ctx.createLinearGradient(metrics.x + metrics.width - 92, 0, metrics.x + metrics.width, 0);
    } else {
      gradient = ctx.createLinearGradient(metrics.x + 92, 0, metrics.x, 0);
    }
    gradient.addColorStop(0, "rgba(255, 203, 90, 0)");
    gradient.addColorStop(1, "rgba(255, 203, 90, 0.08)");
    ctx.fillStyle = gradient;
    ctx.fillRect(metrics.x, metrics.y, metrics.width, metrics.height);

    ctx.restore();
  }

  function drawGravityArrow(cx, cy, size) {
    const direction = boardGame.gravity || GRAVITY.down;
    const dx = direction.col;
    const dy = direction.row;
    const x1 = cx - dx * size * 0.55;
    const y1 = cy - dy * size * 0.55;
    const x2 = cx + dx * size * 0.55;
    const y2 = cy + dy * size * 0.55;
    const perpX = -dy;
    const perpY = dx;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = "rgba(255, 232, 156, 0.9)";
    ctx.fillStyle = "rgba(255, 216, 111, 0.82)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2 + dx * 10, y2 + dy * 10);
    ctx.lineTo(x2 - dx * 12 + perpX * 11, y2 - dy * 12 + perpY * 11);
    ctx.lineTo(x2 - dx * 12 - perpX * 11, y2 - dy * 12 - perpY * 11);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function cellImage(cell) {
    if (boardGame?.mode === "puzzle" && resourceById[cell.type]?.orb) return resourceById[cell.type].orb;
    if (specialBlocks[cell.type]) return specialBlocks[cell.type].image;
    return resourceById[cell.type]?.block || "empty_set.png";
  }

  function drawParticles() {
    for (const particle of boardGame.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / 0.48);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 4 + 5 * (1 - particle.life / 0.48), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawHud() {
    if (boardGame.mode === "puzzle") {
      drawPuzzleHud();
      return;
    }

    if (boardGame.mode === "mine") {
      drawMineHud();
      return;
    }

    ctx.save();
    ctx.fillStyle = "rgba(8, 10, 9, 0.74)";
    ctx.fillRect(0, 0, W, 89);

    ctx.fillStyle = "#f6dfab";
    ctx.textAlign = "center";
    ctx.font = "24px Georgia, serif";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 5;
    ctx.fillText(boardTitle(), W / 2, 27);
    ctx.shadowBlur = 0;

    drawImage("PowerBar.png", 52, 38, 215, 61);
    const progress = boardProgress();
    ctx.save();
    ctx.beginPath();
    ctx.rect(52, 38, 215 * progress, 61);
    ctx.clip();
    drawImage("PowerBar_Filled.png", 52, 38, 215, 61);
    ctx.restore();

    ctx.fillStyle = "#f9e6bc";
    ctx.font = "13px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText(`Crystals ${state.crystals}`, 12, 77);
    ctx.textAlign = "right";
    ctx.fillText(boardRightText(), 306, 77);
    ctx.textAlign = "center";
    ctx.fillText(`Score ${boardGame.score}`, W / 2, 77);
    ctx.save();
    ctx.globalAlpha = 0.8;
    drawGravityArrow(286, 50, 13);
    ctx.restore();

    if (boardGame.mode === "craft") {
      drawCraftTargets();
    } else {
      let x = 20;
      for (const type of resourceTypes) {
        drawImage(type.icon, x, 93, 20, 20);
        ctx.fillStyle = "#f5e6bd";
        ctx.font = "11px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(formatCount(state.resources[type.id]), x + 10, 122);
        x += 58;
      }
    }

    drawBoardMessages();

    ctx.restore();
  }

  function drawMineHud() {
    ctx.save();
    ctx.fillStyle = "rgba(5, 6, 6, 0.62)";
    ctx.fillRect(0, 0, W, 116);

    drawImage("hud_border_mining.png", 0, 0, W, H);

    drawImage("icon_crystals.png", 143, 9, 20, 20);
    ctx.fillStyle = "#f7e6b8";
    ctx.font = "13px Georgia, serif";
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
    ctx.shadowBlur = 4;
    ctx.fillText(formatCount(state.crystals), 167, 24);

    const startX = 72;
    const gap = 43;
    for (let index = 0; index < resourceTypes.length; index += 1) {
      const type = resourceTypes[index];
      const x = startX + index * gap;
      drawImage(type.icon, x, 42, 23, 23);
      ctx.fillStyle = "#f1dfb2";
      ctx.font = "12px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(formatCount(state.resources[type.id]), x + 11.5, 82);
    }

    drawImage("PowerBar.png", 54, 84, 212, 48);
    const progress = boardProgress();
    ctx.save();
    ctx.beginPath();
    ctx.rect(54, 84, 212 * progress, 48);
    ctx.clip();
    drawImage("PowerBar_Filled.png", 54, 84, 212, 48);
    ctx.restore();

    ctx.fillStyle = "#f6dfab";
    ctx.font = "12px Georgia, serif";
    ctx.textAlign = "right";
    ctx.fillText(`D${boardGame.mineDifficulty}`, 306, 24);
    ctx.save();
    ctx.globalAlpha = 0.72;
    drawGravityArrow(292, 57, 11);
    ctx.restore();
    ctx.shadowBlur = 0;

    drawBoardMessages();
    ctx.restore();
  }

  function drawBoardMessages() {
    if (boardGame.messageTimer > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
      ctx.fillRect(88, 211, 144, 48);
      ctx.strokeStyle = "rgba(246, 217, 139, 0.72)";
      ctx.strokeRect(88.5, 211.5, 143, 47);
      ctx.fillStyle = "#ffe5a5";
      ctx.textAlign = "center";
      ctx.font = "22px Georgia, serif";
      ctx.fillText(boardGame.message, W / 2, 242);
    }

    if (boardGame.comboTimer > 0 && boardGame.comboText) {
      const alpha = Math.min(1, boardGame.comboTimer / 0.35);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(36, 19, 8, 0.7)";
      ctx.fillRect(74, 151, 172, 42);
      ctx.strokeStyle = "rgba(255, 221, 135, 0.82)";
      ctx.strokeRect(74.5, 151.5, 171, 41);
      ctx.fillStyle = "#ffdf78";
      ctx.textAlign = "center";
      ctx.font = "24px Georgia, serif";
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 6;
      ctx.fillText(boardGame.comboText, W / 2, 179);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  function drawCraftTargets() {
    const entries = Object.entries(boardGame.craftTarget || {});
    const chipWidth = Math.min(88, (W - 36) / Math.max(1, entries.length));
    const totalWidth = chipWidth * entries.length;
    let x = (W - totalWidth) / 2;

    for (const [id, needed] of entries) {
      const type = resourceById[id];
      const gained = Math.min(needed, boardGame.gained[id] || 0);
      const done = gained >= needed;
      ctx.fillStyle = done ? "rgba(48, 91, 50, 0.72)" : "rgba(8, 10, 9, 0.66)";
      ctx.strokeStyle = done ? "rgba(175, 255, 145, 0.62)" : "rgba(229, 191, 114, 0.34)";
      ctx.fillRect(x, 92, chipWidth - 5, 27);
      ctx.strokeRect(x + 0.5, 92.5, chipWidth - 6, 26);
      drawImage(type.icon, x + 4, 96, 17, 17);
      ctx.fillStyle = "#f5e6bd";
      ctx.font = "11px Georgia, serif";
      ctx.textAlign = "left";
      ctx.fillText(`${formatCount(gained)}/${needed}`, x + 24, 110);
      x += chipWidth;
    }
  }

  function drawPuzzleHud() {
    const metrics = boardMetrics();
    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, W, 92);

    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
    ctx.shadowBlur = 6;

    drawImage("icon_moves.png", 105, 54, 18, 18);
    ctx.fillStyle = "#f4e5bd";
    ctx.font = "16px Georgia, serif";
    ctx.fillText(`${boardGame.movesLeft} Moves Left`, W / 2 + 12, 68);

    ctx.save();
    ctx.globalAlpha = 0.78;
    drawGravityArrow(286, 60, 11);
    ctx.restore();
    ctx.textAlign = "right";
    ctx.font = "11px Georgia, serif";
    ctx.fillStyle = "#d9f4ca";
    ctx.fillText(`Tilt ${boardGame.gravity.label}`, 305, 82);
    ctx.textAlign = "center";

    ctx.font = "15px Georgia, serif";
    ctx.fillStyle = "#dff7cb";
    ctx.fillText(`${Math.max(0, boardGame.puzzleGoal - boardGame.cleared)} Sigils Remain`, W / 2, metrics.y - 12);

    ctx.font = "13px Georgia, serif";
    ctx.fillStyle = "#cfbea0";
    ctx.fillText(boardGame.item?.title || "Magicbook", W / 2, metrics.y - 32);
    ctx.shadowBlur = 0;

    if (boardGame.messageTimer > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
      ctx.fillRect(88, 192, 144, 48);
      ctx.strokeStyle = "rgba(151, 239, 156, 0.72)";
      ctx.strokeRect(88.5, 192.5, 143, 47);
      ctx.fillStyle = "#e9ffca";
      ctx.font = "22px Georgia, serif";
      ctx.fillText(boardGame.message, W / 2, 223);
    }

    if (boardGame.comboTimer > 0 && boardGame.comboText) {
      const alpha = Math.min(1, boardGame.comboTimer / 0.35);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(11, 29, 16, 0.72)";
      ctx.fillRect(74, 181, 172, 42);
      ctx.strokeStyle = "rgba(178, 255, 156, 0.82)";
      ctx.strokeRect(74.5, 181.5, 171, 41);
      ctx.fillStyle = "#dfff9d";
      ctx.font = "22px Georgia, serif";
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 6;
      ctx.fillText(boardGame.comboText, W / 2, 208);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function boardTitle() {
    if (boardGame.mode === "craft") return "Smith";
    if (boardGame.mode === "puzzle") return "Tower";
    return "Mine";
  }

  function boardRightText() {
    if (boardGame.mode === "craft") return `Time ${Math.ceil(boardGame.timeLeft)}`;
    if (boardGame.mode === "puzzle") return `Moves ${boardGame.movesLeft}`;
    return `${boardGame.gravity.label} D${boardGame.mineDifficulty}`;
  }

  function boardProgress() {
    if (boardGame.mode === "craft") {
      const target = boardGame.craftTarget || boardGame.item.target;
      const done = Object.entries(target).reduce(
        (sum, [id, amount]) => sum + Math.min(1, boardGame.gained[id] / amount),
        0
      );
      return Math.min(1, done / Object.keys(target).length);
    }
    if (boardGame.mode === "puzzle") return Math.min(1, boardGame.cleared / boardGame.puzzleGoal);
    return Math.min(1, state.xp / xpNeeded());
  }

  function pointerToCell(event) {
    if (!boardGame || boardGame.status !== "playing") return null;
    if (isMineOpening()) return null;
    const { x, y } = eventToCanvasPoint(event);
    const metrics = boardMetrics();
    const offset = creepOffset(metrics);
    const col = Math.floor((x - metrics.x - offset.x) / metrics.cellW) + metrics.colStart;
    const row = Math.floor((y - metrics.y - offset.y) / metrics.cellH) + metrics.rowStart;
    if (col < metrics.colStart || col > metrics.colEnd || row < metrics.rowStart || row > metrics.rowEnd) return null;
    return { row, col, x, y };
  }

  function eventToCanvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * W,
      y: ((event.clientY - bounds.top) / bounds.height) * H,
    };
  }

  function handlePointerDown(event) {
    unlockAudio();
    pointerStart = pointerToCell(event);
  }

  function handlePointerUp(event) {
    const end = pointerToCell(event);
    if (!boardGame) return;
    const start = pointerStart || end;
    pointerStart = null;
    const point = eventToCanvasPoint(event);
    if (!end) return;

    const dragX = point.x - start.x;
    const dragY = point.y - start.y;
    if (start && Math.max(Math.abs(dragX), Math.abs(dragY)) > TILE * 0.28) {
      const metrics = boardMetrics();
      const horizontal = Math.abs(dragX) >= Math.abs(dragY);
      const direction = horizontal ? Math.sign(dragX) : Math.sign(dragY);
      const target = {
        row: horizontal ? start.row : Math.max(metrics.rowStart, Math.min(metrics.rowEnd, start.row + direction)),
        col: horizontal
          ? Math.max(metrics.colStart, Math.min(metrics.colEnd, start.col + direction))
          : start.col,
      };
      swap(start, target);
      return;
    }

    const dx = end.col - start.col;
    const dy = end.row - start.row;
    if (start && Math.abs(dx) + Math.abs(dy) === 1) {
      swap(start, end);
      return;
    }

    if (
      boardGame.selected &&
      Math.abs(boardGame.selected.row - end.row) + Math.abs(boardGame.selected.col - end.col) === 1
    ) {
      swap(boardGame.selected, end);
      boardGame.selected = null;
    } else {
      boardGame.selected = { row: end.row, col: end.col };
    }
  }

  function swap(a, b) {
    if (!boardGame || boardGame.status !== "playing") return;
    if (!canSwap(a, b)) {
      boardGame.message = boardGame.mode === "puzzle" ? "" : "Slide Cross";
      boardGame.messageTimer = boardGame.mode === "puzzle" ? 0 : 0.45;
      playSound("invalid");
      return;
    }
    const first = boardGame.grid[a.row]?.[a.col];
    const second = boardGame.grid[b.row]?.[b.col];
    if (!first && !second) return;
    if (boardGame.mode === "puzzle" && (!first || !second)) {
      playSound("invalid");
      return;
    }

    queueSwapAnimation(first, a, b);
    queueSwapAnimation(second, b, a);
    boardGame.grid[a.row][a.col] = second || null;
    boardGame.grid[b.row][b.col] = first || null;
    boardGame.cursor = { row: b.row, col: b.col };
    boardGame.selected = null;
    playSound("swap");

    if (boardGame.mode === "puzzle" && !spendPuzzleMove("The magicbook sealed itself.")) {
      return;
    }

    const pendingSpecials = [];
    if (first && specialTypes.has(first.type)) {
      pendingSpecials.push({ cellId: first.id, row: b.row, col: b.col, partnerType: second?.type || null });
    }
    if (second && specialTypes.has(second.type)) {
      pendingSpecials.push({ cellId: second.id, row: a.row, col: a.col, partnerType: first?.type || null });
    }
    if (pendingSpecials.length) {
      boardGame.pendingSpecials.push(...pendingSpecials);
      boardGame.resolving = 0;
      boardGame.matchCheck = 0.08;
      return;
    }

    boardGame.resolving = 0;
    boardGame.matchCheck = 0.12;
    const settled = settleBoard(true);
    if (!settled && !boardGame.animations.size) {
      resolveMatches();
    }
  }

  function spendPuzzleMove(message) {
    if (boardGame.mode !== "puzzle") return true;
    boardGame.movesLeft -= 1;
    if (boardGame.movesLeft >= 0) return true;
    finishBoard(false, "Out Of Moves", message);
    return false;
  }

  function canSwap(a, b) {
    if (a.row < 0 || b.row < 0 || a.col < 0 || b.col < 0) return false;
    if (a.row >= boardGame.grid.length || b.row >= boardGame.grid.length || a.col >= gridColCount() || b.col >= gridColCount()) {
      return false;
    }

    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    if (dr + dc !== 1) return false;
    if (boardGame.mode === "puzzle") return true;

    const gravity = boardGame.gravity || GRAVITY.down;
    return gravity.col === 0 ? dc === 1 : dr === 1;
  }

  function queueSwapAnimation(cell, from, to) {
    if (!cell) return;
    boardGame.animations.set(cell.id, {
      fromRow: from.row,
      fromCol: from.col,
      toRow: to.row,
      toCol: to.col,
      elapsed: 0,
      duration: 0.1,
    });
  }

  function handleKey(event) {
    if (!boardGame || boardGame.status !== "playing") return;
    unlockAudio();
    if (isMineOpening()) return;
    const cursor = boardGame.cursor;
    const key = event.key.toLowerCase();

    if (key === "w") setGravity("up");
    else if (key === "a") setGravity("left");
    else if (key === "s") setGravity("down");
    else if (key === "d") setGravity("right");
    else if (boardGame.mode !== "puzzle" && key === "p") pullRow();
    else if (key === "t") enableTiltSensors();
    else if (event.key === "ArrowLeft") cursor.col = Math.max(boardMetrics().colStart, cursor.col - 1);
    else if (event.key === "ArrowRight") cursor.col = Math.min(boardMetrics().colEnd, cursor.col + 1);
    else if (event.key === "ArrowUp") cursor.row = Math.max(boardMetrics().rowStart, cursor.row - 1);
    else if (event.key === "ArrowDown") cursor.row = Math.min(boardMetrics().rowEnd, cursor.row + 1);
    else if (event.key === " " || event.key === "Enter") {
      swap(cursor, keyboardSwapTarget(cursor));
    } else {
      return;
    }

    boardGame.selected = { ...cursor };
    event.preventDefault();
  }

  function keyboardSwapTarget(cursor) {
    const metrics = boardMetrics();
    if (boardGame.mode === "puzzle") {
      return { row: cursor.row, col: cursor.col < metrics.colEnd ? cursor.col + 1 : cursor.col - 1 };
    }
    const gravity = boardGame.gravity || GRAVITY.down;
    if (gravity.col === 0) return { row: cursor.row, col: cursor.col < metrics.colEnd ? cursor.col + 1 : cursor.col - 1 };
    return { row: cursor.row < metrics.rowEnd ? cursor.row + 1 : cursor.row - 1, col: cursor.col };
  }

  function xpNeeded() {
    return 60 + state.level * 24;
  }

  function formatCount(value) {
    if (value >= 1000) return `${Math.floor(value / 100) / 10}k`;
    return String(Math.floor(value));
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", () => {
    pointerStart = null;
  });
  document.addEventListener("keydown", handleKey);

  preloadImages().then(renderSplash);
})();
