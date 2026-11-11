
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Lodo Líquido (Liquid Ooze).
 * Regra Oficial: Se o oponente tentar drenar HP deste Pokémon, ele recebe dano 
 * igual à quantia que seria curada.
 */
export function handleLiquidOozeDamage(attacker: Pokemon, defender: Pokemon, healAmount: number, logs: {message: string, color: string}[]): boolean {
    if (defender.ability !== 'liquid-ooze' || defender.isFainted) return false;

    // Magic Guard protege contra o dano de Liquid Ooze
    if (attacker.ability === 'magic-guard') {
        log(logs, `${attacker.name} protegeu-se do lodo com seu Guarda Mágica!`, 'text-gray-500 italic text-xs');
        return false;
    }

    attacker.hp = Math.max(0, attacker.hp - healAmount);
    log(logs, `O Lodo Líquido de ${defender.name} feriu ${attacker.name}!`, 'text-red-600 font-bold');
    
    if (attacker.hp === 0) {
        attacker.isFainted = true;
    }
    return true;
}
