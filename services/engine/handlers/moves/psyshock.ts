
/**
 * Lógica para Choque Psíquico (Psyshock) e similares.
 * Regra Oficial: O movimento usa o Ataque Especial do usuário para o cálculo de dano,
 * mas almeja a Defesa Física do alvo (em vez da Defesa Especial).
 */

const PHYSICAL_TARGETING_MOVES = [
    'psyshock',      // Choque Psíquico
    'psystrike',     // Onda Mental (Mewtwo)
    'secret-sword'   // Espada Secreta (Keldeo)
];

/**
 * Verifica se o movimento deve alvejar a Defesa Física do oponente,
 * mesmo sendo da categoria Especial.
 */
export function targetsPhysicalDefense(moveName: string): boolean {
    return PHYSICAL_TARGETING_MOVES.includes(moveName);
}
