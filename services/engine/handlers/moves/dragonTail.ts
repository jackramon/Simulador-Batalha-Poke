
import { Pokemon, BattleState } from '../../../../types';
import { getPokemonPlayerNum, isSamePokemonInstance } from '../../../../utils/pokemonIdentity';
import { log } from '../../utils';
import * as SuctionCups from '../abilities/suction_cups';
import * as GuardDog from '../abilities/guard_dog';
import * as SheerForce from '../abilities/sheer_force';
import { performSwitch } from '../../switching';
import * as Ingrain from './ingrain';

/**
 * Lógica para Cauda do Dragão (Dragon Tail) e Arremesso Circular (Circle Throw).
 * Causa dano e força o oponente a trocar de Pokémon por um aleatório da reserva.
 */
export function handleForceSwitch(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    moveName: string,
    state?: BattleState
) {
    if (!state) return;

    // 1. Verifica Sheer Force (Anula o efeito secundário)
    // Nota: Como Dragon Tail aplica dano, Sheer Force remove a troca forçada
    const moveMock: any = { name: moveName, effect: { status: 'force-switch' }, damageClass: 'physical' };
    if (SheerForce.shouldBlockSecondaryEffects(attacker, moveMock)) {
        return;
    }

    // 2. Verifica Imunidade (Ventosas)
    if (SuctionCups.isImmuneToForcedSwitch(defender, attacker.ability, state, logs)) {
        return;
    }

    // 2.5 Verifica Imunidade (Cão de Guarda)
    if (GuardDog.isImmuneToForcedSwitch(defender, attacker.ability, state, logs)) {
        return;
    }

    // 3. Verifica Imunidade (Enraizar/Ingrain)
    if (Ingrain.isImmuneToForcedSwitch(defender)) {
        log(logs, `${defender.name} está enraizado e não pode ser trocado à força!`, 'text-gray-500 italic');
        return;
    }

    // 4. Identifica o time do defensor
    const isP1 = getPokemonPlayerNum(state, defender) === 1;
    const defenderTeam = isP1 ? state.team1 : state.team2;

    // 5. Busca candidatos válidos na reserva (Não desmaiados e não o próprio)
    const validBackups = defenderTeam.filter(p => !p.isFainted && !isSamePokemonInstance(p, defender));

    if (validBackups.length === 0) {
        log(logs, `Mas falhou! Não há outro Pokémon para trocar!`, 'text-gray-500 italic');
        return;
    }

    // 6. Seleciona aleatoriamente
    const newPokemon = validBackups[Math.floor(Math.random() * validBackups.length)];

    // 7. Usa a transição canônica para saída, hazards, entrada e clima.
    log(logs, `${defender.name} foi arrastado para fora da batalha!`, 'text-orange-600 font-bold');
    log(logs, `${newPokemon.name} foi arrastado para o campo!`, 'text-orange-600 font-bold');
    const result = performSwitch(state, newPokemon, isP1 ? 1 : 2, true);
    Object.assign(state, result.newState);
    logs.push(...result.logs);
}
