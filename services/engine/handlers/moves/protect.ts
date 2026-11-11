
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Proteger (Protect), Detectar (Detect) e Aguentar (Endure).
 * Regra Oficial: 
 * - Protege o usuário de todos os ataques no turno (Protect/Detect).
 * - Ou deixa com 1 HP se fosse ser nocauteado (Endure).
 * - A chance de sucesso cai a cada uso consecutivo (100% -> 33% -> 11% -> ...).
 * - Prioridade: +4 (Geralmente age primeiro).
 */
export function handleProtect(
    attacker: Pokemon, 
    logs: LogEntry[],
    moveName: string = 'protect'
) {
    // Inicializa contador se não existir
    if (attacker.protectCounter === undefined) {
        attacker.protectCounter = 0;
    }

    // Fórmula Gen 9: Chance = 1 / (3 ^ protectCounter)
    // 0 usos anteriores: 1/1 = 100%
    // 1 uso anterior: 1/3 ≈ 33.3%
    // 2 usos anteriores: 1/9 ≈ 11.1%
    const chance = 1 / Math.pow(3, attacker.protectCounter);
    
    // Incrementa contador para a próxima tentativa
    // Nota: O reset deste contador ocorre em preMoveValidation.ts se o usuário escolher um golpe diferente
    attacker.protectCounter++;

    if (Math.random() < chance) {
        // Sucesso
        let status = 'protect';
        if (moveName === 'endure') status = 'endure';
        else if (moveName === 'detect') status = 'detect';
        else if (moveName === 'crafty-shield') status = 'crafty-shield';
        else if (['spiky-shield', 'kings-shield', 'baneful-bunker', 'obstruct', 'silk-trap', 'burning-bulwark'].includes(moveName)) {
            status = moveName;
        }

        // Define o status. A duração é irrelevante pois é limpo no final do turno (turnEnd.ts)
        attacker.statusEffects[status] = { turns: 1 };
        
        let msg = `${attacker.name} protegeu-se!`;
        if (moveName === 'endure') msg = `${attacker.name} se preparou para aguentar o golpe!`;
        if (moveName === 'detect') msg = `${attacker.name} detectou o ataque!`;
        if (moveName === 'silk-trap') msg = `${attacker.name} teceu uma armadilha de seda!`;
        if (moveName === 'spiky-shield') msg = `${attacker.name} se protegeu com espinhos!`;
        if (moveName === 'kings-shield') msg = `${attacker.name} adotou uma postura defensiva!`;
        if (moveName === 'baneful-bunker') msg = `${attacker.name} se protegeu em um bunker!`;
        if (moveName === 'burning-bulwark') msg = `${attacker.name} levantou uma muralha ardente!`;
        if (moveName === 'crafty-shield') msg = `${attacker.name} protegeu-se com um escudo astuto!`;

        log(logs, msg, moveName === 'crafty-shield' ? 'text-pink-500 font-bold' : 'text-blue-500 font-bold');
    } else {
        // Falha
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
    }
}
