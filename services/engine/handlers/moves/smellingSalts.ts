
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Sais de Cheiro (Smelling Salts).
 * Regra Oficial:
 * 1. O poder base dobra (70 -> 140) se o alvo estiver paralisado.
 * 2. Se o alvo estiver paralisado, ele é curado da paralisia após o ataque.
 */

export function getSmellingSaltsPower(defender: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    const isParalyzed = !!defender.statusEffects.paralysis;
    
    return {
        power: isParalyzed ? basePower * 2 : basePower,
        isBoosted: isParalyzed
    };
}

export function handleSmellingSaltsCure(defender: Pokemon, logs: {message: string, color: string}[]) {
    // A cura ocorre mesmo se o usuário tiver Sheer Force?
    // Oficialmente: Sim, Sais de Cheiro NÃO é afetado por Sheer Force porque curar o oponente é considerado um efeito negativo/neutro para o usuário, não um benefício secundário tradicional.
    // Mas no nosso motor, se cair aqui é porque o efeito secundário foi acionado.
    
    if (defender.statusEffects.paralysis) {
        delete defender.statusEffects.paralysis;
        log(logs, `${defender.name} foi curado da paralisia pelos Sais de Cheiro!`, 'text-blue-500 font-bold italic');
    }
}
