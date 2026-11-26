import { Action, BattleReplay, BattleReplayEvent, BattleState, Pokemon } from '../types';
import { normalizeBattleTeams, resolvePokemonTarget } from '../utils/pokemonIdentity';

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
      if (event.moveId !== 'recharge' && event.moveId !== 'struggle') return null;
      // Recarga e Debater são decisões temporárias legítimas fora do set original.
      data = {
        name: event.moveId,
        displayName: event.moveId === 'recharge' ? 'Recarregar' : 'Debater',
        priority: 0,
        type: 'normal',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 1,
        maxPP: 1,
      };
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
