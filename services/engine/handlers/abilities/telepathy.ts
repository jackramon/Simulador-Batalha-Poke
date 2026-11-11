
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Telepatia (Telepathy).
 * Regra Oficial: O Pokémon antecipa e desvia de ataques usados por seus aliados.
 * Em 1v1: Protege o portador caso um movimento seja disparado por um membro do seu próprio time.
 */

export function isImmuneToAllyMove(attacker: Pokemon, defender: Pokemon, state: BattleState): boolean {
    if (defender.ability !== 'telepathy' || defender.isFainted) {
        return false;
    }

    // Verifica se a habilidade está suprimida pelo Gás Neutralizante
    if (!NeutralizingGas.canAbilityTrigger(defender, state)) {
        return false;
    }

    // Em 1v1, um ataque de um aliado é impossível a menos que seja autoinfligido (confusão).
    // Telepatia NÃO protege contra danos autoinfligidos.
    if (attacker === defender) {
        return false;
    }

    // Identifica se o atacante e o defensor estão no mesmo time.
    // Usa 'includes' (comparação por referência) em vez de ID para evitar conflitos 
    // se ambos os jogadores tiverem a mesma espécie de Pokémon (mesmo Pokedex ID).
    const isAttackerP1 = state.team1.includes(attacker);
    const isDefenderP1 = state.team1.includes(defender);

    // Se ambos estiverem no time 1 OU ambos no time 2 (i.e. mesmo valor booleano), são aliados.
    // Em 1v1 normal (Attacker vs Defender), isso deve retornar false.
    return isAttackerP1 === isDefenderP1;
}

export function logTelepathyProtection(defender: Pokemon, logs: { message: string, color: string }[]) {
    log(logs, `${defender.name} desvia do ataque do aliado com sua Telepatia!`, 'text-indigo-600 italic font-bold');
}
