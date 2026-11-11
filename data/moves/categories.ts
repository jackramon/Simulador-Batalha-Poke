
export const MOVE_PRIORITIES: Record<string, number> = {
  'extreme-speed': 2, 'sucker-punch': 1, 'quick-attack': 1, 'mach-punch': 1,
  'bullet-punch': 1, 'ice-shard': 1, 'aqua-jet': 1, 'vacuum-wave': 1,
  'shadow-sneak': 1, 'fake-out': 3, 'protect': 4, 'detect': 4, 'endure': 4,
  'first-impression': 2, 'feint': 2, 'teleport': -6, 'trick-room': -7,
  'roar': -6, 'whirlwind': -6, 'dragon-tail': -6, 'circle-throw': -6, 'counter': -5, 'mirror-coat': -5,
  'upper-hand': 3, 'avalanche': -4, 'beak-blast': -3, 'revenge': -4, 'focus-punch': -3,
  'shell-trap': -3, 'thunderclap': 1, 'vital-throw': -1, 'silk-trap': 4,
  'baby-doll-eyes': 1, 'snatch': 4, 'rage-powder': 2, 'follow-me': 2, 'ally-switch': 2,
  'crafty-shield': 3, 'spiky-shield': 4, 'kings-shield': 4, 'baneful-bunker': 4, 'obstruct': 4, 'burning-bulwark': 4,
  'magic-coat': 4, 'quick-guard': 3
};

export const NON_CONTACT_PHYSICAL_MOVES = [
    'earthquake', 'rock-slide', 'stone-edge', 'icicle-crash', 'bonemerang', 
    'bone-rush', 'bullet-seed', 'rock-blast', 'seed-bomb', 'gunk-shot', 
    'ice-shard', 'rock-throw', 'smack-down', 'mud-bomb', 'magnitude', 
    'fissure', 'petal-blizzard', 'razor-leaf', 'leaf-blade', 'sacred-sword', 
    'psycho-cut', 'night-slash', 'cross-poison', 'slash', 'air-cutter',
    'swift', 'feint-attack', 'bulldoze', 'rock-tomb',
    'metal-burst', 'counter', 'sand-tomb', 'diamond-storm', 'precipice-blades',
    'behemoth-blade', 'glacial-lance', 'thousand-waves', 'natural-gift', 'poltergeist',
    'spirit-shackle', 'secret-power', 'attack-order', 'beat-up', 'explosion', 'self-destruct',
    'egg-bomb', 'barrage', 'bone-club', 'sky-attack', 'freeze-shock', 'ice-burn', 'fusion-bolt',
    'bolt-strike', 'sacred-fire', 'mountain-gale', 'splintered-stormshards', 'raging-fury'
];

export const CONTACT_SPECIAL_MOVES = [
    'grass-knot', 'petal-dance', 'trump-card', 'wring-out', 'draining-kiss', 'electro-web'
];

export const TWO_TURN_MOVES: Record<string, {status?: string, msg: string}> = {
    'solar-beam': { status: 'charging', msg: 'absorveu luz!' },
    'solar-blade': { status: 'charging', msg: 'absorveu luz!' },
    'skull-bash': { status: 'defense-up', msg: 'abaixou a cabeça!' },
    'razor-wind': { status: 'charging', msg: 'criou um redemoinho!' },
    'sky-attack': { status: 'charging', msg: 'brilha intensamente!' },
    'freeze-shock': { status: 'charging', msg: 'ficou coberto de gelo!' },
    'ice-burn': { status: 'charging', msg: 'ficou coberto de ar frio!' },
    'geomancy': { status: 'charging', msg: 'está absorvendo energia!' },
    'meteor-beam': { status: 'spAttack-up', msg: 'está acumulando energia cósmica!' },
    'electro-shot': { status: 'spAttack-up', msg: 'está acumulando eletricidade!' },
    'dig': { status: 'digging', msg: 'cavou um buraco!' },
    'fly': { status: 'flying', msg: 'voou alto!' },
    'dive': { status: 'diving', msg: 'mergulhou na água!' },
    'bounce': { status: 'bouncing', msg: 'saltou alto!' },
    'phantom-force': { status: 'shadow-force', msg: 'desapareceu nas sombras!' },
    'shadow-force': { status: 'shadow-force', msg: 'desapareceu nas sombras!' }
};

export const RECHARGE_MOVES = [
    'hyper-beam', 'giga-impact', 'frenzy-plant', 'blast-burn', 'hydro-cannon', 
    'rock-wrecker', 'roar-of-time', 'eternabeam', 'prismatic-laser', 'meteor-assault'
];

export const DRAIN_MOVES: Record<string, number> = {
    'absorb': 0.5, 'mega-drain': 0.5, 'giga-drain': 0.5, 'drain-punch': 0.5,
    'horn-leech': 0.5, 'leech-life': 0.5, 'draining-kiss': 0.75, 'parabolic-charge': 0.5,
    'oblivion-wing': 0.75, 'matcha-gotcha': 0.5, 'dream-eater': 0.5
};

export const OHKO_MOVES = ['fissure', 'guillotine', 'horn-drill', 'sheer-cold'];

export const HIGH_CRIT_MOVES = [
    'slash', 'razor-leaf', 'crabhammer', 'karate-chop', 'cross-chop', 
    'aeroblast', 'air-cutter', 'stone-edge', 'night-slash', 'shadow-claw',
    'psycho-cut', 'leaf-blade', 'attack-order', 'cross-poison', 'drill-run',
    'blaze-kick', 'poison-tail', 'sky-attack', 'spacial-rend', 'esper-wing',
    'triple-arrows', 'stone-axe', 'ceaseless-edge', 'aqua-cutter'
];

export const PARTIAL_TRAPPING_MOVES = [
    'bind', 'wrap', 'fire-spin', 'clamp', 'whirlpool', 
    'sand-tomb', 'magma-storm', 'infestation', 'snap-trap', 'thunder-cage'
];

export const SLICING_MOVES = [
    'cut', 'razor-leaf', 'slash', 'false-swipe', 'fury-cutter', 'aerial-ace', 
    'leaf-blade', 'night-slash', 'air-slash', 'x-scissor', 'psycho-cut', 
    'cross-poison', 'air-cutter', 'sacred-sword', 'razor-shell', 'secret-sword', 
    'solar-blade', 'behemoth-blade', 'stone-axe', 'ceaseless-edge', 'population-bomb', 
    'kowtow-cleave', 'bitter-blade', 'aqua-cutter', 'psyblade'
];

export const BALL_BOMB_MOVES = [
    'acid-spray', 'aura-sphere', 'barrage', 'beak-blast', 'bullet-seed', 
    'egg-bomb', 'electro-ball', 'energy-ball', 'focus-blast', 'gyro-ball', 
    'ice-ball', 'magnet-bomb', 'mist-ball', 'mud-bomb', 'octazooka', 
    'pollen-puff', 'pyro-ball', 'rock-blast', 'rock-wrecker', 'searing-shot', 
    'seed-bomb', 'shadow-ball', 'sludge-bomb', 'weather-ball', 'zap-cannon'
];

export const SOUND_MOVES = [
    'boomburst', 'bug-buzz', 'chatter', 'clanging-scales', 'confide', 
    'disarming-voice', 'echoed-voice', 'grass-whistle', 'growl', 'heal-bell', 
    'howl', 'hyper-voice', 'metal-sound', 'noble-roar', 'overdrive', 
    'parting-shot', 'perish-song', 'relic-song', 'roar', 'round', 
    'screech', 'sing', 'snarl', 'snore', 'sparkling-aria', 'supersonic', 
    'uproar', 'torch-song', 'alluring-voice', 'psychic-noise'
];

export const DANCE_MOVES = [
    'feather-dance', 'fiery-dance', 'dragon-dance', 'lunar-dance', 
    'petal-dance', 'quiver-dance', 'revelation-dance', 'swords-dance', 
    'teeter-dance', 'victory-dance', 'aqua-step'
];

export const GRASSY_REDUCED_MOVES = [
    'earthquake', 'magnitude', 'bulldoze'
];

export const DAMAGE_RECOIL_MOVES: Record<string, number> = {
    'take-down': 0.25, 'double-edge': 0.33, 'submission': 0.25, 'volt-tackle': 0.33,
    'flare-blitz': 0.33, 'brave-bird': 0.33, 'wood-hammer': 0.33, 'head-smash': 0.5,
    'wild-charge': 0.25, 'head-charge': 0.25, 'wave-crash': 0.33
};

export const HP_RECOIL_MOVES: Record<string, number> = {
    'struggle': 0.25, 'mind-blown': 0.5, 'steel-beam': 0.5, 'chloroblast': 0.5
};

export const BITING_MOVES = [
    'bite', 'crunch', 'fire-fang', 'ice-fang', 'thunder-fang', 'poison-fang', 
    'psychic-fangs', 'hyper-fang', 'super-fang', 'fishious-rend', 'jaw-lock'
];

export const PUNCH_MOVES = [
    'bullet-punch', 'comet-punch', 'dizzy-punch', 'drain-punch', 'dynamic-punch', 
    'fire-punch', 'focus-punch', 'hammer-arm', 'ice-punch', 'mach-punch', 
    'mega-punch', 'meteor-mash', 'plasma-fists', 'power-up-punch', 'shadow-punch', 
    'sky-uppercut', 'thunder-punch', 'ice-hammer', 'jet-punch', 'wicked-blow', 
    'surging-strikes', 'headlong-rush', 'rage-fist'
];

export const EXPLOSIVE_MOVES = [
    'self-destruct', 'explosion', 'mind-blown', 'misty-explosion'
];

export const WIND_MOVES = [
    'aeroblast', 'air-cutter', 'air-slash', 'bleakwind-storm', 'blizzard', 
    'defog', 'fairy-wind', 'gust', 'heat-wave', 'hurricane', 'icy-wind', 
    'petal-blizzard', 'sandsear-storm', 'razor-wind', 'sandstorm', 
    'silver-wind', 'springtide-storm', 'tailwind', 'twister', 'whirlwind', 
    'wildbolt-storm'
];

export const PULSE_MOVES = [
    'aura-sphere', 'dark-pulse', 'dragon-pulse', 'heal-pulse', 
    'origin-pulse', 'terrain-pulse', 'water-pulse'
];

export const VARIABLE_POWER_MOVES: Record<string, number> = {
    'low-kick': 0, 'grass-knot': 0, 'heavy-slam': 0, 'heat-crash': 0,
    'gyro-ball': 0, 'electro-ball': 0, 'flail': 0, 'reversal': 0,
    'water-spout': 150, 'eruption': 150, 'dragon-energy': 150,
    'wring-out': 120, 'crush-grip': 120, 'hard-press': 100
};

export const MULTI_HIT_MOVES: Record<string, {min: number, max: number}> = {
    'double-slap': {min: 2, max: 5}, 'comet-punch': {min: 2, max: 5}, 'fury-attack': {min: 2, max: 5},
    'pin-missile': {min: 2, max: 5}, 'spike-cannon': {min: 2, max: 5}, 'barrage': {min: 2, max: 5},
    'fury-swipes': {min: 2, max: 5}, 'bone-rush': {min: 2, max: 5}, 'bullet-seed': {min: 2, max: 5},
    'icicle-spear': {min: 2, max: 5}, 'rock-blast': {min: 2, max: 5}, 'tail-slap': {min: 2, max: 5},
    'arm-thrust': {min: 2, max: 5}, 'double-kick': {min: 2, max: 2}, 'double-hit': {min: 2, max: 2},
    'dual-chop': {min: 2, max: 2}, 'dual-wingbeat': {min: 2, max: 2}, 'bonemerang': {min: 2, max: 2},
    'gear-grind': {min: 2, max: 2}, 'dragon-darts': {min: 2, max: 2}, 'triple-kick': {min: 3, max: 3},
    'triple-axel': {min: 3, max: 3}, 'population-bomb': {min: 1, max: 10}, 'scale-shot': {min: 2, max: 5},
    'water-shuriken': {min: 2, max: 5}, 'surging-strikes': {min: 3, max: 3}
};

export const ALWAYS_HIT_MOVES = [
    'swift', 'feint-attack', 'aerial-ace', 'magical-leaf', 'shock-wave', 
    'magnet-bomb', 'shadow-punch', 'vital-throw', 'aura-sphere', 'smart-strike', 
    'flower-trick', 'kowtow-cleave', 'blood-moon', 'matcha-gotcha'
];

export const HITS_FLYING_MOVES = [
    'gust', 'twister', 'thunder', 'hurricane', 'sky-uppercut', 
    'smack-down', 'thousand-arrows'
];

export const HITS_DIGGING_MOVES = [
    'earthquake', 'magnitude', 'fissure'
];

export const HITS_DIVING_MOVES = [
    'surf', 'whirlpool'
];
