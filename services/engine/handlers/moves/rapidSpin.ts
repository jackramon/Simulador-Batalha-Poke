
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as StatMoves from './statChanges';
import * as Hazards from '../hazards';

/**
 * Lógica para o movimento Giro Rápido (Rapid Spin).
 * Efeitos:
 * 1. Aumenta a Velocidade do usuário em 1 estágio (100%).
 * 2. Remove efeitos de aprisionamento (Bind, Wrap, etc) e Leech Seed do usuário.
 * 3. Remove perigos de entrada (Hazards) do lado do usuário.
 */
export function handleRapidSpin(attacker: Pokemon, logs: {message: string, color: string}[], state?: BattleState) {
    // 1. Aumenta a Velocidade
    StatMoves.applyMoveStatChange(attacker, 'speed-up', logs, false, false, 'rapid-spin', state);

    let cleared = false;

    // 2. Remove Aprisionamentos e Leech Seed
    const trappingMoves = [
        'bind', 'wrap', 'fire-spin', 'whirlpool', 'clamp', 
        'sand-tomb', 'magma-storm', 'infestation', 'snap-trap', 'thunder-cage'
    ];

    trappingMoves.forEach(m => {
        if (attacker.statusEffects[m]) {
            delete attacker.statusEffects[m];
            cleared = true;
        }
    });

    if (attacker.statusEffects['leech-seed']) {
        delete attacker.statusEffects['leech-seed'];
        cleared = true;
    }

    // 3. Remove Hazards do lado do usuário
    if (state) {
        const isP1 = state.currentPokemon1?.id === attacker.id;
        const hazards = isP1 ? state.p1Hazards : state.p2Hazards;

        // Verifica se há hazards para setar a flag de log
        if (hazards.stealthRock || hazards.spikes > 0 || hazards.toxicSpikes > 0 || hazards.stickyWeb) {
            cleared = true;
        }

        Hazards.clearEntryHazards(hazards);
    }

    if (cleared) {
        log(logs, BATTLE_MESSAGES.RAPID_SPIN_CLEAR(attacker.name), 'text-blue-600 font-bold');
    }
}
