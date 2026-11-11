
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Voto de Fogo (Fire Pledge).
 * Poder Base: 80.
 * Mecânica de Combo (Duplas): 
 * - Com Voto de Grama (Grass Pledge): Cria um mar de fogo que causa dano residual.
 * - Em 1v1 (Simulador atual): Funciona como um movimento de dano padrão.
 */
export function getFirePledgePower(attacker: Pokemon, basePower: number): number {
    // Em uma implementação futura de Batalhas Duplas, aqui verificaríamos 
    // se o parceiro usou Grass Pledge para combos.
    // Para 1v1, retorna o poder base padrão.
    return basePower;
}
