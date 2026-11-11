
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Vingança (Revenge).
 * Regra Oficial: Dobra o poder base (60 -> 120) se o usuário 
 * tiver recebido dano do alvo no mesmo turno.
 * Possui prioridade negativa (-4) para facilitar essa condição.
 */
export function getRevengePower(attacker: Pokemon, defender: Pokemon, currentPower: number): { power: number, isBoosted: boolean } {
    // Reutiliza o rastreador de dano do Avalanche, pois a lógica de trigger é a mesma
    // (ter recebido dano do alvo no turno corrente)
    const hitTracker = attacker.statusEffects['avalanche-tracker'];
    
    // Verifica se o rastreador indica que este Pokémon foi atingido pelo defensor atual neste turno
    if (hitTracker && hitTracker.sourceMoveName === defender.id.toString()) {
        return { power: currentPower * 2, isBoosted: true };
    }
    
    return { power: currentPower, isBoosted: false };
}
