import { Action, BattleConfig, BattleReplay, BattleReplayCheckpoint, BattleReplayEvent, BattleState, Move, Pokemon } from '../types';
import { normalizeBattleTeams, resolvePokemonTarget } from '../utils/pokemonIdentity';
import { createBattlePRNGState } from '../utils/prng';
import { createTemporaryActionData } from './engine/temporaryActions';

export const REPLAY_FORMAT_VERSION = 1;
// Revisão semântica do motor. A 4.1.1 corrigiu regras de batalha (Tera Stellar defensivo,
// Rocky Payload em 1.5x, críticos com estágios, Surge Surfer na ordenação de ações e
// distinção Snow/Hail). A 4.1.2 deu ciclo de vida completo a Taunt, Encore, Disable,
// Magnet Rise, Telekinesis e Glaive Rush: os efeitos passaram a decrementar e expirar no
// `processTurnEnd` canônico, em vez de durarem indefinidamente. Replays gravados em
// revisões anteriores foram produzidos com as regras antigas e podem divergir na
// reprodução: a divergência é real e continua sendo reportada, sem tolerância que a esconda.
export const REPLAY_ENGINE_REVISION = '4.1.2';
export const LEGACY_REPLAY_WARNING = 'Replay legado: arquivo sem checkpoints; a reprodução continuará sem verificação de integridade.';
// Revisões que gravavam o checkpoint dentro do updater React, com hash sobre um estado
// possivelmente alterado depois da conclusão do turno: não têm integridade confiável.
const UNSTABLE_CHECKPOINT_REVISIONS = new Set(['3.2.0', '3.2.1']);
export const unstableCheckpointWarning = (turn: number, revision: string): string =>
  `Aviso de compatibilidade: o checkpoint do turno ${turn} gravado na revisão ${revision} não tem integridade confiável (hash divergente, PRNG coincidente). A reprodução continua, mas regrave a batalha na revisão ${REPLAY_ENGINE_REVISION} para obter checkpoints verificáveis.`;

interface ParsedBattleReplay {
  replay: BattleReplay;
  legacy: boolean;
  warning: string;
}

const replayPrngState = (state: BattleState) => ({
  ...(state.prngState ?? createBattlePRNGState(state.turnSeed ?? state.seed ?? 0)),
});

// Remove somente apresentação; os demais campos preservam inclusive regras dinâmicas dos golpes.
const canonicalMove = (move: Move | null | undefined): unknown => {
  if (!move) return move;
  const { displayName: _displayName, description: _description, ...mechanicalData } = move;
  return mechanicalData;
};

const canonicalPokemon = (pokemon: Pokemon | null): unknown => {
  if (!pokemon) return null;
  const {
    name: _name,
    spriteUrl: _spriteUrl,
    backSpriteUrl: _backSpriteUrl,
    pixelSpriteUrl: _pixelSpriteUrl,
    fallbackUrls: _fallbackUrls,
    cries: _cries,
    isShiny: _isShiny,
    ...mechanicalData
  } = pokemon;
  // O PP do pool é derivado de `moves`: em memória o mesmo objeto de golpe pode estar
  // compartilhado entre `moves` e `movePool` (o motor decrementa só o golpe usado) e o
  // JSON do replay perde esse alias. Derivar de `moves` mantém o hash independente da
  // representação e idêntico entre a batalha ao vivo e a reprodução.
  const usableUses = new Map<string, number>();
  pokemon.moves?.forEach(move => { usableUses.set(move.name, move.uses); });
  const canonicalPool = pokemon.movePool?.map(move => {
    if (!move) return move;
    const uses = usableUses.get(move.name);
    const { displayName: _poolDisplayName, description: _poolDescription, ...poolMove } = move;
    return uses === undefined ? poolMove : { ...poolMove, uses };
  });
  const megaProfile = pokemon.megaProfile ? (() => {
    const {
      name: _megaName,
      spriteUrl: _megaSprite,
      backSpriteUrl: _megaBackSprite,
      pixelSpriteUrl: _megaPixelSprite,
      ...mechanicalProfile
    } = pokemon.megaProfile!;
    return mechanicalProfile;
  })() : undefined;
  const illusionData = pokemon.illusionData
    ? { originalGender: pokemon.illusionData.originalGender }
    : undefined;
  return {
    ...mechanicalData,
    moves: pokemon.moves.map(canonicalMove),
    movePool: canonicalPool,
    lastMoveUsed: canonicalMove(pokemon.lastMoveUsed),
    selectedMove: canonicalMove(pokemon.selectedMove),
    megaProfile,
    illusionData,
  };
};

const canonicalBattleState = (state: BattleState): unknown => ({
  turn: state.turn,
  team1: state.team1.map(canonicalPokemon),
  team2: state.team2.map(canonicalPokemon),
  currentPokemon1: canonicalPokemon(state.currentPokemon1),
  currentPokemon2: canonicalPokemon(state.currentPokemon2),
  p1Inventory: state.p1Inventory,
  p2Inventory: state.p2Inventory,
  p1TeraUsed: state.p1TeraUsed,
  p2TeraUsed: state.p2TeraUsed,
  p1MegaUsed: state.p1MegaUsed,
  p2MegaUsed: state.p2MegaUsed,
  weather: state.weather,
  weatherTurns: state.weatherTurns,
  terrain: state.terrain,
  terrainTurns: state.terrainTurns,
  gravity: state.gravity,
  gravityTurns: state.gravityTurns,
  mudSportTurns: state.mudSportTurns,
  waterSportTurns: state.waterSportTurns,
  ionDelugeActive: state.ionDelugeActive,
  wonderRoomActive: state.wonderRoomActive,
  wonderRoomTurns: state.wonderRoomTurns,
  magicRoomActive: state.magicRoomActive,
  magicRoomTurns: state.magicRoomTurns,
  trickRoomActive: state.trickRoomActive,
  trickRoomTurns: state.trickRoomTurns,
  p1Hazards: state.p1Hazards,
  p2Hazards: state.p2Hazards,
  isBattleInProgress: state.isBattleInProgress,
  winner: state.winner,
  prngState: replayPrngState(state),
});

const stableSerialize = (value: unknown): string => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') return Number.isFinite(value) ? JSON.stringify(value) : 'null';
  if (Array.isArray(value)) return `[${value.map(item => stableSerialize(item) || 'null').join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined && typeof entry !== 'function' && typeof entry !== 'symbol')
      .sort(([left], [right]) => {
        if (left === right) return 0;
        return left < right ? -1 : 1;
      });
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`).join(',')}}`;
  }
  return 'null';
};

// FNV-1a de 32 bits sobre os bytes UTF-16: síncrono e idêntico em Node e navegador.
export const hashBattleReplayState = (state: BattleState): string => {
  const serialized = stableSerialize(canonicalBattleState(state));
  let hash = 0x811C9DC5;
  for (let index = 0; index < serialized.length; index += 1) {
    const code = serialized.charCodeAt(index);
    hash = Math.imul(hash ^ (code & 0xFF), 0x01000193);
    hash = Math.imul(hash ^ (code >>> 8), 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

export const createReplayCheckpoint = (turn: number, state: BattleState): BattleReplayCheckpoint => {
  const megaProfiles = Object.fromEntries([...state.team1, ...state.team2]
    .filter(pokemon => pokemon.instanceId && pokemon.megaProfile)
    .map(pokemon => [pokemon.instanceId!, structuredClone(pokemon.megaProfile!)]));
  // Hash calculado de forma síncrona e resultado congelado: o checkpoint é um
  // snapshot imutável e nenhuma alteração posterior do estado muda o que foi gravado.
  const checkpoint: BattleReplayCheckpoint = {
    turn,
    prngState: Object.freeze(replayPrngState(state)),
    stateHash: hashBattleReplayState(state),
    ...(Object.keys(megaProfiles).length > 0 ? { megaProfiles: Object.freeze(megaProfiles) } : {}),
  };
  return Object.freeze(checkpoint);
};

export const applyReplayCheckpointMegaProfiles = (
  replay: BattleReplay,
  turn: number,
  state: BattleState,
): void => {
  const profiles = replay.checkpoints?.find(checkpoint => checkpoint.turn === turn)?.megaProfiles;
  if (!profiles) return;
  const hydrate = (pokemon: Pokemon | null) => {
    if (!pokemon?.instanceId) return;
    const profile = profiles[pokemon.instanceId];
    if (profile) pokemon.megaProfile = structuredClone(profile);
  };
  state.team1.forEach(hydrate);
  state.team2.forEach(hydrate);
  hydrate(state.currentPokemon1);
  hydrate(state.currentPokemon2);
};

export const createBattleReplay = (
  initialState: BattleState,
  config: BattleConfig,
  seed: number,
): BattleReplay => ({
  formatVersion: REPLAY_FORMAT_VERSION,
  engineRevision: REPLAY_ENGINE_REVISION,
  initialState: {
    team1: structuredClone(initialState.team1),
    team2: structuredClone(initialState.team2),
    p1Inventory: structuredClone(initialState.p1Inventory),
    p2Inventory: structuredClone(initialState.p2Inventory),
    config: structuredClone(config),
  },
  seed,
  events: [],
  checkpoints: [createReplayCheckpoint(0, initialState)],
});

export const appendReplayCheckpoint = (
  replay: BattleReplay,
  turn: number,
  state: BattleState,
): BattleReplay => appendReplayCheckpointSnapshot(replay, createReplayCheckpoint(turn, state));

// Anexa um checkpoint JÁ calculado (e imutável). É o único caminho usado pelo
// updater React: ele nunca recalcula hash e nunca lê o estado vivo.
export const appendReplayCheckpointSnapshot = (
  replay: BattleReplay,
  checkpoint: BattleReplayCheckpoint,
): BattleReplay => {
  if (replay.formatVersion !== REPLAY_FORMAT_VERSION) return replay;
  const checkpoints = [...(replay.checkpoints ?? []).filter(entry => entry.turn !== checkpoint.turn), checkpoint]
    .sort((left, right) => left.turn - right.turn);
  return { ...replay, checkpoints };
};

const invalidReplay = (detail: string): Error => new Error(`Formato de replay inválido: ${detail}`);

export const parseBattleReplay = (value: unknown): ParsedBattleReplay => {
  if (!value || typeof value !== 'object') throw invalidReplay('conteúdo ausente.');
  const data = value as Partial<BattleReplay>;
  if (!data.initialState || typeof data.seed !== 'number' || !Number.isFinite(data.seed) || !Array.isArray(data.events)) {
    throw invalidReplay('estado inicial, seed ou eventos ausentes.');
  }

  if (data.formatVersion === undefined) {
    if (data.engineRevision !== undefined || data.checkpoints !== undefined) {
      throw invalidReplay('campos versionados exigem formatVersion.');
    }
    return { replay: data as BattleReplay, legacy: true, warning: LEGACY_REPLAY_WARNING };
  }
  if (!Number.isInteger(data.formatVersion)) throw invalidReplay('formatVersion deve ser inteiro.');
  if (data.formatVersion > REPLAY_FORMAT_VERSION) {
    throw new Error(`Versão de replay ${data.formatVersion} não suportada. Esta versão do simulador suporta até a versão ${REPLAY_FORMAT_VERSION}.`);
  }
  if (data.formatVersion !== REPLAY_FORMAT_VERSION) {
    throw new Error(`Versão de replay ${data.formatVersion} não suportada.`);
  }
  if (typeof data.engineRevision !== 'string' || !data.engineRevision) {
    throw invalidReplay('engineRevision ausente na versão 1.');
  }
  if (!Array.isArray(data.checkpoints) || data.checkpoints[0]?.turn !== 0) {
    throw invalidReplay('checkpoint inicial ausente na versão 1.');
  }
  for (const checkpoint of data.checkpoints) {
    if (!Number.isInteger(checkpoint?.turn) || typeof checkpoint.stateHash !== 'string'
      || !Number.isFinite(checkpoint.prngState?.seed)
      || !Number.isFinite(checkpoint.prngState?.state)
      || !Number.isInteger(checkpoint.prngState?.cursor)) {
      throw invalidReplay(`checkpoint inválido no turno ${String(checkpoint?.turn)}.`);
    }
  }
  return { replay: data as BattleReplay, legacy: false, warning: '' };
};

export const assertReplayCheckpoint = (
  replay: BattleReplay,
  turn: number,
  state: BattleState,
  stateBeforeTurn?: BattleState,
): string | null => {
  if (replay.formatVersion === undefined) return null;
  if (replay.formatVersion !== REPLAY_FORMAT_VERSION) {
    throw new Error(`Versão de replay ${replay.formatVersion} não suportada.`);
  }
  const expected = replay.checkpoints?.find(checkpoint => checkpoint.turn === turn);
  if (!expected) throw new Error(`Replay incompatível: checkpoint do turno ${turn} ausente.`);
  const actual = createReplayCheckpoint(turn, state);
  const prngDiverged = expected.prngState.seed !== actual.prngState.seed
    || expected.prngState.state !== actual.prngState.state
    || expected.prngState.cursor !== actual.prngState.cursor;
  if (expected.stateHash !== actual.stateHash || prngDiverged) {
    // Política de compatibilidade explícita para revisões que gravaram o hash dentro do
    // updater React: PRNG divergente = rejeição; apenas hash instável = aviso visível.
    if (!prngDiverged && UNSTABLE_CHECKPOINT_REVISIONS.has(replay.engineRevision)) {
      return unstableCheckpointWarning(turn, replay.engineRevision);
    }
    if (replay.engineRevision === '3.2.0' && stateBeforeTurn) {
      const premature = createReplayCheckpoint(turn, stateBeforeTurn);
      const matchesPrematurePrng = expected.prngState.seed === premature.prngState.seed
        && expected.prngState.state === premature.prngState.state
        && expected.prngState.cursor === premature.prngState.cursor;
      if (expected.stateHash === premature.stateHash && matchesPrematurePrng) {
        throw new Error(`Replay incompatível: a revisão 3.2.0 gravou o checkpoint do turno ${turn} antes das ações. O hash final não está disponível e não será substituído. Regrave a batalha na revisão ${REPLAY_ENGINE_REVISION}.`);
      }
    }
    const prngDetail = prngDiverged
      ? ` PRNG esperado ${stableSerialize(expected.prngState)}, obtido ${stableSerialize(actual.prngState)}.`
      : '';
    throw new Error(`Divergência de replay no turno ${turn}: hash esperado ${expected.stateHash}, hash obtido ${actual.stateHash}.${prngDetail} Reprodução interrompida.`);
  }
  return null;
};

interface CreateReplayEventOptions {
  turn: number;
  player: 1 | 2;
  type: BattleReplayEvent['actionType'];
  data: any;
  user: Pokemon;
  shouldTerastallize?: boolean;
  shouldMegaEvolve?: boolean;
  isForcedSwitch?: boolean;
  isBatonPass?: boolean;
}

export const createBattleReplayEvent = ({
  turn,
  player,
  type,
  data,
  user,
  shouldTerastallize,
  shouldMegaEvolve,
  isForcedSwitch,
  isBatonPass,
}: CreateReplayEventOptions): BattleReplayEvent => ({
  turn,
  actionType: type,
  actorId: player,
  actorInstanceId: user.instanceId,
  targetId: type === 'item' ? data?.targetId : undefined,
  targetInstanceId: type === 'item' ? data?.targetInstanceId : undefined,
  moveId: type === 'move' ? data?.name : undefined,
  switchId: type === 'switch' ? data?.id : undefined,
  switchInstanceId: type === 'switch' ? data?.instanceId : undefined,
  itemId: type === 'item' ? data?.itemId : undefined,
  moveName: type === 'item' ? data?.moveName : undefined,
  isGive: type === 'item' ? data?.isGive : undefined,
  shouldTerastallize,
  shouldMegaEvolve,
  isForcedSwitch,
  isBatonPass,
});

export const normalizeReplayTeams = (
  initialState: Pick<BattleReplay['initialState'], 'team1' | 'team2'>,
): { team1: Pokemon[]; team2: Pokemon[] } =>
  normalizeBattleTeams(initialState.team1, initialState.team2);

export const resolveReplaySwitchTarget = (
  state: BattleState,
  event: BattleReplayEvent,
): Pokemon | undefined => {
  const team = event.actorId === 1 ? state.team1 : state.team2;
  return resolvePokemonTarget(team, event.switchInstanceId, event.switchId);
};

export const buildReplayAction = (
  state: BattleState,
  event: BattleReplayEvent | undefined,
): Action | null => {
  if (!event) return null;

  const team = event.actorId === 1 ? state.team1 : state.team2;
  const currentUser = event.actorId === 1 ? state.currentPokemon1 : state.currentPokemon2;
  const user = event.actorInstanceId
    ? resolvePokemonTarget(team, event.actorInstanceId)
    : currentUser;
  if (!user) return null;

  let data: Action['data'];
  let priority = 6;

  if (event.actionType === 'move') {
    data = user.moves.find(move => move.name === event.moveId);
    if (!data) {
      // Recarga e Debater não fazem parte do moveset: usam a mesma definição da batalha ao vivo,
      // porque o objeto escolhido é gravado em `selectedMove` e entra no hash do checkpoint.
      data = createTemporaryActionData(event.moveId);
      if (!data) return null;
    }
    priority = data.priority || 0;
  } else if (event.actionType === 'switch') {
    data = resolveReplaySwitchTarget(state, event);
    if (!data) return null;
  } else {
    const target = resolvePokemonTarget(team, event.targetInstanceId, event.targetId);
    if (!target) return null;
    data = {
      itemId: event.itemId,
      targetId: target.id,
      targetInstanceId: target.instanceId,
      isGive: event.isGive,
      moveName: event.moveName,
    };
  }

  return {
    type: event.actionType,
    data,
    user,
    playerNum: event.actorId,
    priority,
    shouldTerastallize: event.shouldTerastallize,
    shouldMegaEvolve: event.shouldMegaEvolve,
  };
};

const replayCompatibilityError = (detail: string, turn: number): Error =>
  new Error(`Replay incompatível: ${detail} no turno ${turn}. A reprodução exige decisões gravadas e não chama IA.`);

export const buildReplayTurnAction = (
  state: BattleState,
  event: BattleReplayEvent | undefined,
  player: 1 | 2,
  turn: number,
): Action | undefined => {
  const active = player === 1 ? state.currentPokemon1 : state.currentPokemon2;
  if (!active || active.isFainted) return undefined;
  if (!event) {
    throw replayCompatibilityError(`decisão do Jogador ${player} ausente`, turn);
  }

  const action = buildReplayAction(state, event);
  if (!action) {
    throw replayCompatibilityError(`decisão gravada do Jogador ${player} inválida`, turn);
  }
  return action;
};

export const buildReplayForcedSwitchAction = (
  state: BattleState,
  event: BattleReplayEvent | undefined,
  player: 1 | 2,
  turn: number,
): Action => {
  if (!event) {
    throw replayCompatibilityError(`troca forçada do Jogador ${player} ausente`, turn);
  }

  const action = buildReplayAction(state, event);
  if (!action || action.type !== 'switch') {
    throw replayCompatibilityError(`troca forçada gravada do Jogador ${player} inválida`, turn);
  }
  return action;
};
