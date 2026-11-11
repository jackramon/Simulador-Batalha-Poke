
import { Pokemon, Move, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as AromaVeil from './aroma_veil';
import * as MoldBreaker from './mold_breaker';

export function handleCursedBody(attacker: Pokemon, defender: Pokemon, move: Move, logs: LogEntry[]) {
    if (defender.ability === 'cursed-body' && !defender.isFainted) {
        // Verifica se o atacante tem proteção de Véu de Aroma
        const ignoresAbilities = MoldBreaker.suppressesAbilities(defender.ability); // Mold Breaker do atacante? Não, Cursed Body é do defensor
        // Nota: No Cursed Body, o atacante é quem recebe o efeito. O "ignoresAbilities" deve vir do DEFENSOR para ignorar o Aroma Veil do ATACANTE.
        // Regra Oficial: Aroma Veil protege contra Cursed Body.
        
        if (AromaVeil.isImmuneToDisable(attacker, false)) {
            log(logs, `${attacker.name} protegeu-se da desativação com seu Véu de Aroma!`, 'text-blue-500 italic text-[10px]');
            return;
        }

        if (!attacker.disabledMoves?.[move.name] && Math.random() < 0.3) {
            if (!attacker.disabledMoves) attacker.disabledMoves = {};
            attacker.disabledMoves[move.name] = 4;
            log(logs, `O Corpo Amaldiçoado de ${defender.name} desativou o golpe ${move.displayName} de ${attacker.name}!`, 'text-purple-600 font-bold');
        }
    }
}
