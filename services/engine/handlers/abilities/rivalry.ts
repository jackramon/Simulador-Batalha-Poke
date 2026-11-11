
import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Rivalidade (Rivalry).
 * Regras Oficiais:
 * 1. Aumenta o dano em 25% (1.25x) se o alvo for do mesmo gênero.
 * 2. Reduz o dano em 25% (0.75x) se o alvo for do gênero oposto.
 * 3. Se um ou ambos forem sem gênero (genderless), o dano não muda.
 */
export function getPowerMultiplier(attacker: Pokemon, defender: Pokemon, move: Move): number {
    // Só afeta movimentos de dano
    if (attacker.ability !== 'rivalry' || move.damageClass === 'status') {
        return 1.0;
    }

    // Se qualquer um for sem gênero, o efeito é nulo
    if (attacker.gender === 'genderless' || defender.gender === 'genderless') {
        return 1.0;
    }

    // Mesmos gêneros
    if (attacker.gender === defender.gender) {
        return 1.25;
    }

    // Gêneros opostos
    return 0.75;
}
