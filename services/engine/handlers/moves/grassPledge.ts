
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Voto de Grama (Grass Pledge).
 * Poder Base: 80.
 * Mecânica de Combo (Duplas): Se usado com Voto de Água, cria um pântano que reduz velocidade.
 * Em 1v1 (Simulador atual), funciona como um movimento de dano padrão sem efeitos secundários imediatos.
 */
export function getGrassPledgePower(attacker: Pokemon, basePower: number): number {
    // Em uma implementação futura de Batalhas Duplas, aqui verificariamos 
    // se o parceiro usou Water Pledge ou Fire Pledge para combos.
    // Para 1v1, retorna o poder base padrão.
    return basePower;
}
