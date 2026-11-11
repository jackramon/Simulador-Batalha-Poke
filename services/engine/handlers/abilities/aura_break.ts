import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Aura Inversa (Aura Break).
 * Regra Oficial: Inverte os bônus concedidos pelas habilidades Aura de Fada e Aura Sombria.
 * O efeito em si é processado nos módulos dark_aura.ts e fairy_aura.ts durante o cálculo de dano.
 */

export function announceAuraBreak(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.ability === 'aura-break' && !pokemon.isFainted) {
        log(logs, `${pokemon.name} inverteu todas as auras com sua Aura Inversa!`, 'text-purple-700 font-bold italic');
    }
}
