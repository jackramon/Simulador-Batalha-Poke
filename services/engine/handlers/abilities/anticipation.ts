
import { Pokemon, Move } from '../../../../types';
import { calculateTypeEffectiveness } from '../../../battleUtils';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Antecipação (Anticipation).
 * Ao entrar em batalha, o Pokémon "estremece" se o oponente possuir um golpe:
 * 1. Super efetivo contra ele.
 * 2. De nocaute imediato (OHKO: Fissure, Guillotine, Horn Drill, Sheer Cold).
 * 3. De autodestruição (Self-Destruct, Explosion, Misty Explosion).
 */

const OHKO_MOVES = ['fissure', 'guillotine', 'horn-drill', 'sheer-cold'];
const SELF_DESTRUCT_MOVES = ['self-destruct', 'explosion', 'self-destruction', 'misty-explosion'];

export function checkAnticipation(pokemon: Pokemon, opponent: Pokemon | null, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'anticipation' || !opponent || opponent.isFainted) {
        return false;
    }

    let isDangerous = false;

    for (const move of opponent.moves) {
        // 1. Checa OHKO
        if (OHKO_MOVES.includes(move.name)) {
            isDangerous = true;
            break;
        }

        // 2. Checa Autodestruição
        if (SELF_DESTRUCT_MOVES.includes(move.name)) {
            isDangerous = true;
            break;
        }

        // 3. Checa Super Efetividade
        // Usamos uma versão simplificada de cálculo de efetividade para a IA/Habilidade
        const eff = calculateTypeEffectiveness(move.type, pokemon.types, pokemon.ability);
        if (move.damageClass !== 'status' && eff.multiplier >= 2.0) {
            isDangerous = true;
            break;
        }
    }

    if (isDangerous) {
        log(logs, `${pokemon.name} estremeceu com antecipação!`, 'text-indigo-600 italic font-bold');
        return true;
    }

    return false;
}
