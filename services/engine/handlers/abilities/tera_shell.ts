import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Carapaça Tera (Tera Shell).
 * Se o Pokémon estiver com HP cheio, todos os ataques que o atingem
 * têm sua efetividade alterada para "não muito efetivo" (0.5x).
 */
export function getDamageMultiplier(
    defender: Pokemon, 
    typeEffectiveness: number,
    logs: LogEntry[]
): number {
    // A habilidade só funciona se o HP estiver cheio
    if (defender.hp < defender.maxHP) return 1.0;

    // Se o ataque já for imune (0x), mantém 0x
    if (typeEffectiveness === 0) return 1.0;

    // Se o ataque já for resistido (<= 0.5), mantém como está (ou aplica lógica de resistência forçada?)
    // A descrição diz "são tratados como não muito efetivos".
    // Em jogos oficiais, isso significa que o multiplicador de efetividade se torna 0.5x.
    // Se já for 0.25x, ele SOBE para 0.5x? Não, geralmente habilidades defensivas não pioram a defesa.
    // Mas a implementação mais comum de "make it not very effective" é forçar o multiplicador de resistência.
    // Para simplificar e manter a vantagem defensiva:
    // Se typeEffectiveness > 0.5, forçamos para 0.5.
    // Se typeEffectiveness <= 0.5, mantemos (já é resistido).
    
    if (typeEffectiveness > 0.5) {
        log(logs, `A Carapaça Tera de ${defender.name} resistiu ao ataque!`, 'text-indigo-500 font-bold italic');
        // Retornamos um multiplicador que, quando multiplicado pelo typeEffectiveness original, resulta em 0.5.
        // Ex: Se era 2.0 (Super Effective), retornamos 0.25 -> 2.0 * 0.25 = 0.5.
        // Ex: Se era 1.0 (Neutral), retornamos 0.5 -> 1.0 * 0.5 = 0.5.
        return 0.5 / typeEffectiveness;
    }

    return 1.0;
}
