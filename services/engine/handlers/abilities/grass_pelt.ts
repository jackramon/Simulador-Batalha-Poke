import { Move } from '../../../../types';

/**
 * Lógica para a habilidade Pele de Grama (Grass Pelt).
 * Regra Oficial: Aumenta a Defesa do Pokémon em 50% (1.5x) enquanto o Campo Gramado estiver ativo.
 * No motor de dano, isso se traduz em um multiplicador de 2/3 (~0.66x) no dano físico recebido.
 */
export function getDamageMultiplier(defenderAbility: string | undefined, terrain: string, move: Move): number {
    if (defenderAbility === 'grass-pelt' && terrain === 'grassy' && move.damageClass === 'physical') {
        // Aumento de 50% na defesa reduz o dano final em 1 / 1.5 = 0.666667
        return 0.666667;
    }
    return 1.0;
}
