
export const statusOnlyEffects = {
  // Status conditions
  'toxic': { status: 'toxic', chance: 100 },
  'poison-powder': { status: 'poison', chance: 100 },
  'poison-gas': { status: 'poison', chance: 100 },
  'thunder-wave': { status: 'paralysis', chance: 100 },
  'stun-spore': { status: 'paralysis', chance: 100 },
  'glare': { status: 'paralysis', chance: 100 },
  'will-o-wisp': { status: 'burn', chance: 100 },
  'hypnosis': { status: 'sleep', chance: 100 },
  'sleep-powder': { status: 'sleep', chance: 100 },
  'spore': { status: 'sleep', chance: 100 },
  'confuse-ray': { status: 'confusion', chance: 100 },
  'supersonic': { status: 'confusion', chance: 100 },
  'sweet-kiss': { status: 'confusion', chance: 100 },
  'teeter-dance': { status: 'confusion', chance: 100 },

  // Stats - User
  'swords-dance': { status: 'attack-up', chance: 100 },
  'nasty-plot': { status: 'spAttack-up', chance: 100 },
  'agility': { status: 'speed-up', chance: 100 },
  'rock-polish': { status: 'speed-up', chance: 100 },
  'autotomize': { status: 'autotomize', chance: 100 },
  'autotomize-effect': { status: 'autotomize', chance: 100 }, // Fallback key
  'iron-defense': { status: 'defense-up', chance: 100 },
  'acid-armor': { status: 'defense-up', chance: 100 },
  'barrier': { status: 'defense-up', chance: 100 },
  'cosmic-power': { status: 'defense-up', chance: 100 }, // Parcial: aumenta Defesa (Ideal seria Def+SpDef)
  'amnesia': { status: 'spDefense-up', chance: 100 },
  'double-team': { status: 'evasion-up', chance: 100 },
  'minimize': { status: 'evasion-up', chance: 100 },
  'tail-glow': { status: 'spAttack-up', chance: 100 },
  'aura-wheel': { status: 'speed-up', chance: 100 },
  'focus-energy': { status: 'focus-energy', chance: 100 },

  // Stats - Target
  'leer': { status: 'defense-down', chance: 100 },
  'tail-whip': { status: 'defense-down', chance: 100 },
  'growl': { status: 'attack-down', chance: 100 },
  'screech': { status: 'defense-down', chance: 100 },
  'scary-face': { status: 'speed-down', chance: 100 },
  'string-shot': { status: 'speed-down', chance: 100 },
  'cotton-spore': { status: 'speed-down', chance: 100 },
  'fake-tears': { status: 'spDefense-down', chance: 100 },
  'metal-sound': { status: 'spDefense-down', chance: 100 },
  'feather-dance': { status: 'attack-down', chance: 100 },
  'charm': { status: 'attack-down', chance: 100 },
  'confide': { status: 'spAttack-down', chance: 100 },

  // Others
  'recover': { status: 'heal', chance: 100 },
  'roost': { status: 'heal', chance: 100 },
  'slack-off': { status: 'heal', chance: 100 },
  'soft-boiled': { status: 'heal', chance: 100 },
  'milk-drink': { status: 'heal', chance: 100 },
  'moonlight': { status: 'heal', chance: 100 },
  'morning-sun': { status: 'heal', chance: 100 },
  'synthesis': { status: 'heal', chance: 100 },
  'shore-up': { status: 'heal', chance: 100 },
  'heal-order': { status: 'heal', chance: 100 },
  'rest': { status: 'heal', chance: 100 },
  
  'sunny-day': { status: 'weather', chance: 100 },
  'rain-dance': { status: 'weather', chance: 100 },
  'sandstorm': { status: 'weather', chance: 100 },
  'hail': { status: 'weather', chance: 100 },

  'leech-seed': { status: 'leech-seed', chance: 100 },
  'memento': { status: 'self-faint', chance: 100 },
  'parting-shot': { status: 'switch-self', chance: 100 },
  
  'endure': { status: 'endure', chance: 100 },
  'psycho-shift': { status: 'psycho-shift', chance: 100 },
  'entrainment': { status: 'entrainment', chance: 100 },
  
  'toxic-thread': { status: 'toxic-thread', chance: 100 },
  'after-you': { status: 'after-you', chance: 100 },
  'tickle': { status: 'tickle', chance: 100 },
};
