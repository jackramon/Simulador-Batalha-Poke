
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Mão Amiga (Helping Hand).
 * Regra Oficial: Aumenta o poder do ataque de um aliado em 50% (1.5x) neste turno.
 * Adaptação 1v1: Como não há aliados, o usuário "ajuda a si mesmo", aumentando o poder
 * do seu próximo ataque em 50%.
 */
export function handleHelpingHand(attacker: Pokemon, logs: LogEntry[]) {
    // Aplica o status 'helping-hand'.
    // Duração indefinida (-1) até que seja consumido pelo próximo ataque de dano.
    attacker.statusEffects['helping-hand'] = { turns: -1 };
    
    log(logs, `${attacker.name} está se preparando para ajudar!`, 'text-indigo-600 font-bold');
}

/**
 * Retorna o multiplicador de dano da Mão Amiga e consome o efeito.
 * Deve ser chamado durante o cálculo de dano.
 */
export function getHelpingHandMultiplier(attacker: Pokemon, logs: LogEntry[]): number {
    if (attacker.statusEffects['helping-hand']) {
        // Consome o efeito
        delete attacker.statusEffects['helping-hand'];
        
        log(logs, `O poder foi aumentado pela Mão Amiga!`, 'text-indigo-600 font-bold italic');
        return 1.5;
    }
    return 1.0;
}
