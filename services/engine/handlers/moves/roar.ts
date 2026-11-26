
import { Pokemon, BattleState } from '../../../../types';
import { BattlePRNG, nextBattleRandom } from '../../../../utils/prng';
import { getPokemonPlayerNum, isSamePokemonInstance } from '../../../../utils/pokemonIdentity';
import { log } from '../../utils';
import * as SuctionCups from '../abilities/suction_cups';
import * as GuardDog from '../abilities/guard_dog';
import * as Ingrain from './ingrain';
import { performSwitch } from '../../switching';

/**
 * Lógica para os movimentos Rugido (Roar) e Redemoinho (Whirlwind).
 * Categoria: Status.
 * Efeito: Força o oponente a trocar de Pokémon por um aleatório da reserva.
 * Bloqueado por: Ventosas (Suction Cups), Enraizar (Ingrain), Guard Craft (não imp).
 * Refletido por: Magic Bounce (tratado no router).
 * Imunidade: Soundproof (para Roar, tratado na eficácia).
 */
export function handleRoar(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState,
    prng?: BattlePRNG
) {
    if (!state) return;

    // 1. Verifica Imunidade a Troca Forçada (Ventosas / Suction Cups)
    if (SuctionCups.isImmuneToForcedSwitch(defender, attacker.ability, state, logs)) {
        return;
    }

    // 1.5 Verifica Imunidade a Troca Forçada (Cão de Guarda / Guard Dog)
    if (GuardDog.isImmuneToForcedSwitch(defender, attacker.ability, state, logs)) {
        return;
    }

    // 2. Verifica Imunidade de Enraizar (Ingrain)
    if (Ingrain.isImmuneToForcedSwitch(defender)) {
        log(logs, `${defender.name} está preso ao chão pelas raízes e não pode ser movido!`, 'text-gray-500 italic');
        return;
    }

    // 3. Identifica o time do defensor
    const isP1 = getPokemonPlayerNum(state, defender) === 1;
    const defenderTeam = isP1 ? state.team1 : state.team2;

    // 4. Busca candidatos válidos na reserva (Não desmaiados e não o próprio)
    const validBackups = defenderTeam.filter(p => !p.isFainted && !isSamePokemonInstance(p, defender));

    if (validBackups.length === 0) {
        log(logs, `Mas falhou! Não há outro Pokémon para substituir ${defender.name}!`, 'text-gray-500 italic');
        return;
    }

    // 5. Seleciona aleatoriamente
    const newPokemon = validBackups[Math.floor(nextBattleRandom(state, prng) * validBackups.length)];

    // 6. Usa a transição canônica para saída, hazards, entrada e clima.
    log(logs, `${defender.name} foi afugentado da batalha!`, 'text-orange-600 font-bold');
    log(logs, `${newPokemon.name} foi arrastado para o campo!`, 'text-orange-600 font-bold');
    const result = performSwitch(state, newPokemon, isP1 ? 1 : 2, true);
    Object.assign(state, result.newState);
    logs.push(...result.logs);
}
