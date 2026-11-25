import { BattleState, Pokemon } from '../types';

export const createPokemonInstanceId = (playerNum: 1 | 2, slot: number): string =>
  `p${playerNum}-slot-${slot}`;

export const normalizeTeamInstanceIds = (
  team: Pokemon[],
  playerNum: 1 | 2,
  usedInstanceIds: Set<string> = new Set<string>(),
): Pokemon[] => team.map((pokemon, slot) => {
  const currentId = pokemon.instanceId?.trim();
  let instanceId = currentId && !usedInstanceIds.has(currentId)
    ? currentId
    : createPokemonInstanceId(playerNum, slot);

  let suffix = 1;
  while (usedInstanceIds.has(instanceId)) {
    instanceId = `${createPokemonInstanceId(playerNum, slot)}-${suffix}`;
    suffix += 1;
  }

  usedInstanceIds.add(instanceId);
  return pokemon.instanceId === instanceId ? pokemon : { ...pokemon, instanceId };
});

export const normalizeBattleTeams = (
  team1: Pokemon[],
  team2: Pokemon[],
): { team1: Pokemon[]; team2: Pokemon[] } => {
  const usedInstanceIds = new Set<string>();
  const normalizedTeam1 = normalizeTeamInstanceIds(team1, 1, usedInstanceIds);
  const normalizedTeam2 = normalizeTeamInstanceIds(team2, 2, usedInstanceIds);
  return { team1: normalizedTeam1, team2: normalizedTeam2 };
};

export const isSamePokemonInstance = (
  left: Pokemon | null | undefined,
  right: Pokemon | null | undefined,
): boolean => {
  if (!left || !right) return false;
  if (left === right) return true;
  return !!left.instanceId && left.instanceId === right.instanceId;
};

export const isPokemonOnTeam = (pokemon: Pokemon, team: Pokemon[]): boolean =>
  team.some(candidate => isSamePokemonInstance(candidate, pokemon));

export const getPokemonPlayerNum = (state: BattleState, pokemon: Pokemon): 1 | 2 =>
  isSamePokemonInstance(state.currentPokemon1, pokemon) || isPokemonOnTeam(pokemon, state.team1) ? 1 : 2;

export const resolvePokemonTarget = (
  team: Pokemon[],
  instanceId?: string,
  speciesId?: number,
): Pokemon | undefined => {
  if (instanceId) return team.find(pokemon => pokemon.instanceId === instanceId);
  if (speciesId === undefined) return undefined;
  const speciesMatches = team.filter(pokemon => pokemon.id === speciesId);
  return speciesMatches.length === 1 ? speciesMatches[0] : undefined;
};
