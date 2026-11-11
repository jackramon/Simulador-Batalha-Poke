
import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

export function checkRestriction(
    attacker: Pokemon, 
    move: Move, 
    logs: {message: string, color: string}[],
    defender?: Pokemon // Parâmetro opcional para suportar Imprison
): boolean {
    
    // 1. Encore (Bis)
    // Força o usuário a usar apenas o movimento encorajo.
    if (attacker.statusEffects['encore']) {
        const encoredMoveName = attacker.statusEffects['encore'].moveName;
        
        // Se o movimento escolhido não for o encorajo
        if (encoredMoveName && move.name !== encoredMoveName) {
            // Tenta encontrar o movimento encorajo na lista
            const forcedMove = attacker.moves.find(m => m.name === encoredMoveName);
            
            if (forcedMove) {
                // Em um jogo real, o menu travaria. No simulador, se a IA ou jogador enviar outro comando,
                // nós podemos forçar a falha ou sobrescrever (vamos optar por falhar/avisar).
                // Mas para fluidez, o ideal seria o UI bloquear. 
                // Aqui, assumimos que se chegou um movimento diferente, o Encore impede.
                
                // Se for Struggle, permite (caso o PP do golpe encorajo tenha acabado)
                if (move.name === 'struggle') return true;

                log(logs, `${attacker.name} só pode usar ${forcedMove.displayName} devido ao Bis!`, 'text-red-500 italic');
                return false;
            } else {
                // Se o Pokémon não tem mais o golpe (ex: Mimic), o Encore acaba
                delete attacker.statusEffects['encore'];
            }
        }
    }

    // 2. Taunt (Provocar)
    // Impede o uso de movimentos de Status.
    if (attacker.statusEffects['taunt']) {
        if (move.damageClass === 'status') {
            log(logs, BATTLE_MESSAGES.TAUNT_BLOCK(attacker.name), 'text-red-500 italic');
            return false;
        }
    }

    // 3. Torment (Tormento)
    // Impede o uso do mesmo movimento duas vezes seguidas.
    if (attacker.statusEffects['torment']) {
        if (attacker.lastMoveUsed && move.name === attacker.lastMoveUsed.name) {
            // Struggle ignora Torment
            if (move.name !== 'struggle') {
                log(logs, `${attacker.name} não pode usar o mesmo golpe duas vezes devido ao Tormento!`, 'text-red-500 italic');
                return false;
            }
        }
    }

    // 4. Imprison (Selo)
    // Se o defensor tiver usado Imprison e conhecer o golpe que o atacante está tentando usar, bloqueia.
    if (defender && defender.statusEffects['imprison']) {
        // Verifica se o defensor conhece o movimento
        const isSealed = defender.moves.some(m => m.name === move.name);
        
        if (isSealed) {
            log(logs, `${attacker.name} não pode usar ${move.displayName} devido ao Selo de ${defender.name}!`, 'text-purple-600 italic');
            return false;
        }
    }

    // 5. Imprison (Auto-Check para evitar conflito lógico?)
    // Se o próprio atacante tiver Imprison ativo, ele pode usar seus golpes normalmente. 
    // A restrição é sobre o oponente.

    return true;
}