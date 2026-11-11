
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Oblivious from '../abilities/oblivious';
import * as AromaVeil from '../abilities/aroma_veil';

/**
 * Lógica para o movimento Provocar (Taunt).
 * Regra Oficial: 
 * 1. O alvo fica impedido de usar movimentos de Status por 3 turnos.
 * 2. Falha se o alvo já estiver provocado.
 * 3. Habilidades como Oblivious e Aroma Veil protegem contra este efeito.
 */
export function handleTaunt(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Verifica se já está sob efeito
    if (defender.statusEffects['taunt']) {
        log(logs, `Mas falhou! ${defender.name} já está provocado.`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica imunidades de Habilidade
    // Oblivious (Insensível)
    if (Oblivious.isImmuneToTaunt(defender)) {
        log(logs, `A habilidade Insensível de ${defender.name} impede a provocação!`, 'text-gray-500 italic text-xs');
        return;
    }
    
    // Aroma Veil (Véu de Aroma) - Protege a si mesmo e aliados (1v1 protege o portador)
    if (AromaVeil.isImmune(defender, 'taunt')) {
        log(logs, `O Véu de Aroma protege ${defender.name} de ataques mentais!`, 'text-pink-500 italic text-xs');
        return;
    }

    // 3. Aplica o status
    // Duração: 3 turnos (Turno atual + 2 próximos turnos completos)
    defender.statusEffects['taunt'] = { 
        turns: 3,
        isVolatile: true,
        batonPassable: false
    };
    
    log(logs, BATTLE_MESSAGES.TAUNT_START(defender.name), 'text-red-600 font-bold italic');
}
