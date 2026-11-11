
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import * as StatusEffect from '../../../effectHandlers';

/**
 * Lógica para a habilidade Toque Venenoso (Poison Touch).
 * Regra Oficial: Tem 30% de chance de envenenar o alvo ao usar movimentos de contato.
 * Esta chance é verificada para cada acerto de um movimento de múltiplos golpes.
 */
export function handlePoisonTouch(
    attacker: Pokemon, 
    defender: Pokemon, 
    hits: number, 
    isContact: boolean, 
    logs: {message: string, color: string}[]
) {
    if (!isContact || attacker.ability !== 'poison-touch' || defender.isFainted) return;

    let poisoned = false;
    for (let i = 0; i < hits; i++) {
        // 30% de chance por acerto
        if (Math.random() < 0.3) {
            // applyStatus lida com imunidades e se o alvo já tem status
            const initialStatusCount = Object.keys(defender.statusEffects).length;
            StatusEffect.applyStatus(defender, 'poison', logs as any, attacker);
            
            // Se o número de status aumentou, significa que o envenenamento pegou
            if (Object.keys(defender.statusEffects).length > initialStatusCount) {
                log(logs, `O Toque Venenoso de ${attacker.name} envenenou o alvo!`, 'text-purple-600 font-bold italic');
                poisoned = true;
                break; // Uma vez envenenado, não precisa checar os outros hits
            }
        }
    }
}
