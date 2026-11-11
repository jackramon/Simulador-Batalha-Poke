
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Eletrificar (Electrify).
 * Regra Oficial: Se o alvo ainda não agiu neste turno, o movimento que ele usar
 * tornam-se do tipo Elétrico.
 */
export function handleElectrify(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // Falha se o alvo já agiu
    if (defender.movedThisTurn) {
        log(logs, `Mas falhou! ${defender.name} já agiu.`, 'text-gray-500 italic');
        return;
    }

    // Aplica o status volátil 'electrify'
    // Este status é verificado no movePipeline.ts durante o cálculo de efetividade do tipo
    defender.statusEffects['electrify'] = { turns: 1 };
    
    log(logs, `${defender.name} foi eletrificado!`, 'text-yellow-500 font-bold italic');
}
