import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as Effects from '../../../effectHandlers';

/**
 * Lógica para a habilidade Míssil Gulp (Gulp Missile).
 * Exclusiva de Cramorant.
 */

const GULP_MOVES = ['surf', 'dive'];

/**
 * Altera a forma do Cramorant após usar Surf ou Mergulho.
 */
export function handleGulpMissileFormChange(attacker: Pokemon, move: Move, logs: { message: string, color: string }[]) {
    if (attacker.ability !== 'gulp-missile' || !GULP_MOVES.includes(move.name) || attacker.isFainted) {
        return;
    }

    const hpRatio = attacker.hp / attacker.maxHP;

    if (hpRatio > 0.5) {
        // Forma Gulping (Arrokuda) - ID 10182
        if (!attacker.statusEffects['gulping-form']) {
            attacker.statusEffects['gulping-form'] = { turns: -1 };
            delete attacker.statusEffects['gorging-form'];
            attacker.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10182.png`;
            log(logs, `${attacker.name} abocanhou uma presa e mudou de forma!`, 'text-blue-600 font-bold italic');
        }
    } else {
        // Forma Gorging (Pikachu) - ID 10183
        if (!attacker.statusEffects['gorging-form']) {
            attacker.statusEffects['gorging-form'] = { turns: -1 };
            delete attacker.statusEffects['gulping-form'];
            attacker.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10183.png`;
            log(logs, `${attacker.name} abocanhou um Pikachu e mudou de forma!`, 'text-yellow-600 font-bold italic text-lg');
        }
    }
}

/**
 * Dispara o contra-ataque do Míssil Gulp ao ser atingido.
 */
export function handleGulpMissileCounter(defender: Pokemon, attacker: Pokemon, logs: { message: string, color: string }[], state: BattleState) {
    if (defender.isFainted || attacker.isFainted) return false;
    
    const isGulping = !!defender.statusEffects['gulping-form'];
    const isGorging = !!defender.statusEffects['gorging-form'];

    if (!isGulping && !isGorging) return false;

    log(logs, `${defender.name} disparou sua presa contra ${attacker.name}!`, 'text-indigo-600 font-black italic');

    // 1. Dano de 1/4 do HP Máximo do Atacante
    if (attacker.ability !== 'magic-guard') {
        const damage = Math.floor(attacker.maxHP / 4) || 1;
        attacker.hp = Math.max(0, attacker.hp - damage);
        log(logs, `${attacker.name} recebeu dano do míssil! (-${damage})`, 'text-red-600 font-bold');
        if (attacker.hp === 0) attacker.isFainted = true;
    }

    // 2. Efeito Secundário
    if (!attacker.isFainted) {
        if (isGulping) {
            // Gulping: Reduz Defesa em 1 estágio
            if (attacker.statStages.defense > -6) {
                attacker.statStages.defense--;
                log(logs, `A presa reduziu a Defesa de ${attacker.name}!`, 'text-red-500');
            }
        } else if (isGorging) {
            // Gorging: Paralisia
            Effects.applyStatus(attacker, 'paralysis', logs as any, defender, false, state);
        }
    }

    // 3. Retorno à forma original
    delete defender.statusEffects['gulping-form'];
    delete defender.statusEffects['gorging-form'];
    defender.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/845.png`;
    log(logs, `${defender.name} voltou à sua forma original.`, 'text-blue-400 italic');

    return true;
}