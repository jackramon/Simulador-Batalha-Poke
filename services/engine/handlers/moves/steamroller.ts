
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Rolo Compressor (Steamroller).
 * Regra Oficial: 
 * 1. O poder base dobra (65 -> 130) se o alvo usou Minimizar.
 * 2. 30% de chance de causar flinch (tratado via stomp-effect).
 * 3. Nunca erra se o alvo usou Minimizar (tratado em mechanics/accuracy.ts).
 */

export function getSteamrollerPower(defender: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    // Verifica se o alvo está minimizado
    // O status 'minimize' é definido em statChanges.ts quando o movimento Minimize é usado
    const isMinimized = !!defender.statusEffects['minimize'];
    
    return {
        power: isMinimized ? basePower * 2 : basePower,
        isBoosted: isMinimized
    };
}
