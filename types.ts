
export interface LogEntry {
  message: string;
  color: string;
}

export interface StatStages {
  accuracy: number;
  evasion: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface StatusEffect {
  turns: number;
  damageAccumulated?: number;
  sourceMoveName?: string; // Nome do golpe que originou o efeito (ex: Redemoinho de Fogo)
  hp?: number; // Adicionado para Substitute
  moveName?: string; // Adicionado para Encore (nome do golpe travado)
  // NOVAS PROPRIEDADES PADRONIZADAS:
  sourceId?: string; // ID ou nome do Pokémon que aplicou o efeito (útil para Leech Seed)
  isVolatile?: boolean; // Define se é um status volátil (limpo ao sair de campo)
  batonPassable?: boolean; // Define se o status é transferido via Baton Pass
}

export interface Move {
  name: string;
  displayName: string;
  power: number;
  type: string;
  accuracy: number;
  isStatus: boolean;
  damageClass: string;
  effect?: {
    status: string;
    chance: number;
  };
  description: string;
  uses: number;
  maxUses: number;
  priority?: number;
  recoilType?: 'damage' | 'max-hp'; // Added recoil type
  recoilValue?: number; // Added recoil percentage
  minHits?: number;
  maxHits?: number;
}

export interface Pokemon {
  id: number;
  name: string;
  speciesId?: string;
  hp: number;
  maxHP: number;
  spriteUrl: string;
  backSpriteUrl: string; // Nova: Sprite de costas (Pixel Art)
  pixelSpriteUrl: string; // Nova: Sprite frontal (Pixel Art)
  fallbackUrls: string[];
  // Áudio
  cries?: {
    latest: string;
    legacy: string;
  };
  attackStat: number; // Base Stat
  defenseStat: number; // Base Stat
  spAttackStat: number; // Base Stat
  spDefenseStat: number; // Base Stat
  speedStat: number; // Base Stat
  
  // NOVOS CAMPOS DE ATRIBUTOS
  ivs?: PokemonStats;
  evs?: PokemonStats;
  nature?: string;
  level?: number;
  baseHp?: number; // Base Stat para recálculo de HP

  weight: number; // Adicionado: peso em hectogramas (100g)
  ability: string;
  possibleAbilities?: string[]; // Lista de habilidades disponíveis para este Pokémon
  heldItem: string | null;
  consumedItem?: string | null; // Adicionado: rastreia o último item consumido
  hadItem: boolean;
  lockedMove: string | null;
  disabledMoves?: Record<string, number>; // Added for Cursed Body / Disable
  moves: Move[];
  movePool?: Move[]; // Adicionado: Lista completa de movimentos disponíveis para reroll
  movesUsed: string[]; // Rastreia movimentos usados desde a entrada em campo (para Last Resort)
  lastMoveUsed?: Move | null; // Rastreia o último movimento executado com sucesso (para Encore/Torment/Mimic)
  types: string[];
  teraType?: string; // GEN 9: Tipo Tera do Pokémon
  isTerastallized?: boolean; // GEN 9: Se o Pokémon está sob efeito do Terastal
  
  // MEGA EVOLUTION
  megaProfile?: {
    name: string;
    stats: PokemonStats; // Novos Stats Base
    ability: string;
    types: string[];
    spriteUrl: string;
    backSpriteUrl: string;
    pixelSpriteUrl: string;
    weight: number;
  };
  isMega?: boolean; // Se o Pokémon já Mega Evoluiu

  gender: 'male' | 'female' | 'genderless'; // Updated gender type
  isFainted: boolean;
  isFlinched: boolean; // Added flinch status
  lastMoveFailed?: boolean; // Rastreia se o último movimento usado falhou (para Stomping Tantrum)
  turnsActive: number; // Added to track rounds for Fake Out
  protectCounter?: number; // Rastreia usos consecutivos de Protect/Detect
  chargingMove: string | null; // Added for two-turn moves (Fly, Dig, Solar Beam)
  mustRecharge: boolean; // Added for Hyper Beam style moves
  statusEffects: Record<string, StatusEffect>;
  statStages: StatStages;
  movedThisTurn?: boolean; // Rastreia se já moveu no turno atual
  selectedMove?: Move | null; // O movimento escolhido para o turno atual
  isShiny?: boolean; // Indica se o Pokémon é Brilhante (Shiny)
  // Armazena dados originais quando sob o efeito da habilidade Ilusão
  illusionData?: {
    originalName: string;
    originalSprite: string;
    originalGender: 'male' | 'female' | 'genderless';
  };
}

export interface SideHazards {
    toxicSpikes: number;
    reflect: number;     // Turnos restantes de Reflect
    lightScreen: number; // Turnos restantes de Light Screen
    safeguard: number;   // Turnos restantes de Safeguard
    mist: number;        // Turnos restantes de Mist
    luckyChant: number;  // Turnos restantes de Lucky Chant (Canção da Sorte)
    auroraVeil: number;  // Turnos restantes de Aurora Veil
    stealthRock: boolean; // Pedras Ocultas
    stickyWeb: boolean;   // Teia Pegajosa
    spikes: number;       // Espinhos (0 a 3 camadas)
    tailwind: number;     // Vento de Cauda (Turnos restantes)
}

// Interface para um item na mochila
export interface BagItem {
  id: string;
  quantity: number;
}

// Interface para o inventário do jogador
export interface PlayerInventory {
  items: BagItem[];
}

export interface BattleReplayEvent {
  turn: number;
  actionType: 'move' | 'switch' | 'item';
  actorId: 1 | 2;
  targetId?: number;
  moveId?: string;
  switchId?: number;
  itemId?: string;
  isGive?: boolean;
  shouldTerastallize?: boolean;
  shouldMegaEvolve?: boolean;
  isForcedSwitch?: boolean;
  isBatonPass?: boolean;
}

export interface BattleReplay {
  initialState: {
    team1: Pokemon[];
    team2: Pokemon[];
    p1Inventory: PlayerInventory;
    p2Inventory: PlayerInventory;
    config: BattleConfig;
  };
  seed: number;
  events: BattleReplayEvent[];
}

export interface BattleState {
  team1: Pokemon[];
  team2: Pokemon[];
  currentPokemon1: Pokemon | null;
  currentPokemon2: Pokemon | null;
  // Novos campos de inventário
  p1Inventory: PlayerInventory;
  p2Inventory: PlayerInventory;
  // Controle de Terastalização (Um uso por batalha)
  p1TeraUsed?: boolean;
  p2TeraUsed?: boolean;
  // Controle de Mega Evolução (Um uso por batalha)
  p1MegaUsed?: boolean;
  p2MegaUsed?: boolean;
  
  turn: number;
  weather: 'none' | 'sun' | 'rain' | 'sand' | 'hail';
  weatherTurns: number;
  terrain: 'none' | 'electric' | 'grassy' | 'misty' | 'psychic'; // Adicionado terrenos
  terrainTurns: number; // Adicionado contador de turnos de terreno
  gravity: boolean; // Adicionado Gravidade
  gravityTurns: number; // Contador de Gravidade
  mudSportTurns: number; // Adicionado contador de Esporte de Lama
  waterSportTurns: number; // Adicionado contador de Esporte de Água
  ionDelugeActive: boolean; // Adicionado Dilúvio de Íons
  wonderRoomActive: boolean; // Adicionado Sala Maravilhosa
  wonderRoomTurns: number; // Contador de Sala Maravilhosa
  magicRoomActive: boolean; // Adicionado Sala Mágica
  magicRoomTurns: number; // Contador de Sala Mágica
  trickRoomActive: boolean;
  trickRoomTurns: number;
  p1Hazards: SideHazards;
  p2Hazards: SideHazards;
  logs: LogEntry[];
  isBattleInProgress: boolean;
  winner: number | 'draw' | null;
  waitingForAction: boolean;
}

export interface BattleConfig {
  p1Mode: 'manual' | 'random' | 'builder' | 'import'; // Added 'builder' and 'import'
  p1TeamSize: number;
  p1Input: string;
  p2Mode: 'manual' | 'random' | 'builder' | 'import'; // Added 'builder' and 'import'
  p2TeamSize: number;
  p2Input: string;
  opponentMode: 'manual' | 'auto';
  weatherEnabled: boolean;
  terrainEnabled: boolean; // Adicionado terreno habilitado
  itemsEnabled: boolean; // Nova configuração: Habilitar uso de itens da mochila
  terastallizationEnabled: boolean; // GEN 9: Habilitar mecânica Tera
  megaEvolutionEnabled: boolean; // GEN 6: Habilitar mecânica Mega
  moveLimitEnabled: boolean;
  p1AutoMode: boolean;
  useLLM?: boolean; // Nova configuração: Inteligência Artificial Real (LLM)
  llmProvider?: 'gemini' | 'openrouter' | 'deepseek'; // Provedor de LLM
  llmModel?: string; // Modelo do LLM
  randomIvs: boolean; // Nova configuração: IVs aleatórios
  randomLevels: boolean; // Nova configuração: Níveis aleatórios
  forceAccuracyOutcome?: 'hit' | 'miss'; // For AI Expectimax Simulation
  fixedRoll?: number; // For AI Expectimax Simulation (0.85-1.00)
}

export interface Action {
  type: 'move' | 'switch' | 'item'; // Adicionado tipo 'item'
  data: any; // Move, Pokemon, or Item details
  user: Pokemon;
  playerNum: 1 | 2;
  priority?: number;
  speed?: number;
  shouldTerastallize?: boolean; // GEN 9: Intenção de usar Tera neste turno
  shouldMegaEvolve?: boolean; // GEN 6: Intenção de usar Mega neste turno
  tieBreaker?: number; // Pre-calculated tie-breaker for speed ties
  calculatedPriority?: number; // Pre-calculated priority to avoid PRNG desync
}
