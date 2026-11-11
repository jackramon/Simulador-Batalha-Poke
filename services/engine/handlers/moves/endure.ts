import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { handleProtect } from './protect';

/**
 * Lógica para o movimento Aguentar (Endure).
 * Permite que o usuário resista a qualquer ataque que o nocautearia, deixando-o com 1 HP.
 * A chance de sucesso diminui com o uso consecutivo.
 */
export function handleEndure(attacker: Pokemon, logs: LogEntry[]) {
    // Reutiliza a lógica de contador e sucesso de Protect/Detect
    handleProtect(attacker, logs, 'endure');
}

/**
 * Aplica o efeito de Aguentar (Endure).
 * Se o Pokémon tiver o status 'endure' e o dano for fatal, ele sobrevive com 1 HP.
 * Deve ser chamado antes de aplicar o dano final.
 */
export function applyEndure(defender: Pokemon, damage: number, logs: LogEntry[]): number {
    // Se não tiver o status, retorna o dano original
    if (!defender.statusEffects.endure) {
        return damage;
    }

    // Se o dano for suficiente para nocautear (>= HP atual)
    if (damage >= defender.hp) {
        log(logs, `${defender.name} aguentou o golpe!`, 'text-blue-600 font-bold');
        
        // Retorna o dano necessário para deixar com 1 HP
        // Ex: HP 100, Dano 200 -> Retorna 99. HP Final: 100 - 99 = 1.
        // Ex: HP 1, Dano 10 -> Retorna 0. HP Final: 1 - 0 = 1.
        return Math.max(0, defender.hp - 1);
    }

    return damage;
}
