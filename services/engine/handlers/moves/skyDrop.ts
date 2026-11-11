
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as HeavyMetal from '../abilities/heavy_metal';
import { calculateHitChance } from '../../mechanics/accuracy';

/**
 * Lógica para Queda Livre (Sky Drop).
 * Turno 1: Levanta o alvo para o céu (se não falhar).
 * Turno 2: Derruba o alvo.
 */

export function checkFailure(
    attacker: Pokemon, 
    defender: Pokemon, 
    state: BattleState, 
    logs: LogEntry[]
): boolean {
    // 1. Falha se a Gravidade estiver ativa
    if (state.gravity) {
        log(logs, `Mas falhou! A gravidade é muito forte!`, 'text-gray-500 italic');
        return true;
    }

    // 2. Falha se o alvo for do tipo Voador
    // Verifica Terastalização (se terastalizado, usa o tipo Tera)
    const defenderIsFlying = defender.isTerastallized 
        ? defender.teraType === 'flying'
        : defender.types.includes('flying');

    if (defenderIsFlying) {
        log(logs, `Mas falhou! ${defender.name} é do tipo Voador.`, 'text-gray-500 italic');
        return true;
    }

    // 3. Falha se o alvo pesar 200kg ou mais
    const weight = HeavyMetal.getEffectiveWeight(defender); // em hectogramas
    if (weight >= 2000) { // 2000 hg = 200 kg
        log(logs, `Mas falhou! ${defender.name} é muito pesado!`, 'text-gray-500 italic');
        return true;
    }

    // 4. Falha se o alvo tiver Substituto
    if (defender.statusEffects['substitute']) {
        log(logs, `Mas falhou! O substituto bloqueou o ataque.`, 'text-gray-500 italic');
        return true;
    }

    return false;
}

export function handleChargeTurn(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[], 
    state: BattleState,
    move: any // Passando o objeto do movimento para checar precisão
): boolean {
    // Checagem manual de precisão no primeiro turno
    // Sky Drop precisa "acertar" para levantar o alvo
    const hitChance = calculateHitChance(move, attacker, defender, state.weather, state.gravity);
    
    if (hitChance !== '∞' && Math.random() * 100 > (hitChance as number)) {
        log(logs, `O ataque falhou!`, 'text-gray-500 italic');
        return false; // Não procede com a carga
    }

    // Aplica o status de Sky Drop no defensor
    defender.statusEffects['sky-drop-target'] = { 
        turns: 1, 
        sourceMoveName: attacker.id.toString() 
    };

    log(logs, `${attacker.name} levou ${defender.name} para o céu!`, 'text-blue-600 font-bold');
    return true;
}

export function handleDrop(defender: Pokemon) {
    if (defender.statusEffects['sky-drop-target']) {
        delete defender.statusEffects['sky-drop-target'];
    }
}
