
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Avalanche.
 * Regra Oficial: Dobra o poder base do movimento (60 -> 120) se o usuário 
 * tiver recebido dano do alvo no mesmo turno.
 */
export function getAvalanchePower(attacker: Pokemon, defender: Pokemon, currentPower: number): number {
    const hitTracker = attacker.statusEffects['avalanche-tracker'];
    
    // Verifica se o rastreador indica que este Pokémon foi atingido pelo defensor atual neste turno
    if (hitTracker && hitTracker.sourceMoveName === defender.id.toString()) {
        return currentPower * 2;
    }
    
    return currentPower;
}
