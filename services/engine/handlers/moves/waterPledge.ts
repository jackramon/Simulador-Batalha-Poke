
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Voto de Água (Water Pledge).
 * Poder Base: 80.
 * Mecânica de Combo (Duplas): 
 * - Com Voto de Fogo (Fire Pledge): Cria um arco-íris que aumenta a chance de efeitos secundários.
 * - Em 1v1 (Simulador atual): Funciona como um movimento de dano padrão.
 */
export function getWaterPledgePower(attacker: Pokemon, basePower: number): number {
    // Em uma implementação futura de Batalhas Duplas, aqui verificaríamos 
    // se o parceiro usou Fire Pledge para combos.
    // Para 1v1, retorna o poder base padrão.
    return basePower;
}
