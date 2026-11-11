
import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';
import { PARTIAL_TRAPPING_MOVES } from '../../../../data/moves';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Verifica se um movimento é do tipo aprisionamento parcial (ex: Fire Spin, Wrap).
 */
export function isPartialTrappingMove(move: Move): boolean {
    return PARTIAL_TRAPPING_MOVES.includes(move.name);
}

/**
 * Aplica o efeito de aprisionamento ao defensor.
 * Dura de 4 a 5 turnos nos jogos modernos.
 */
export function applyPartialTrapping(attacker: Pokemon, defender: Pokemon, move: Move, logs: {message: string, color: string}[]) {
    if (!move.effect) return;
    
    // Se já estiver preso por este movimento, reseta o contador
    if (defender.statusEffects[move.effect.status]) {
        defender.statusEffects[move.effect.status].turns = Math.floor(Math.random() * 2) + 4;
        log(logs, `${defender.name} continua preso no ataque!`, 'text-purple-600 italic');
        return;
    }

    // Duração padrão: 4 a 5 turnos
    const duration = Math.floor(Math.random() * 2) + 4;
    
    defender.statusEffects[move.effect.status] = { 
        turns: duration, 
        sourceMoveName: move.displayName 
    };
    
    // Mensagens específicas baseadas no status
    let msg = `${defender.name} foi aprisionado!`;
    if (move.name === 'infestation') msg = `${defender.name} foi infestado!`;
    else if (move.name === 'sand-tomb') msg = `${defender.name} foi soterrado pela Tumba de Areia!`;
    else if (move.name === 'whirlpool') msg = `${defender.name} foi preso no vórtice!`;
    else if (move.name === 'fire-spin') msg = `${defender.name} está preso no turbilhão de fogo!`;
    else if (move.name === 'magma-storm') msg = `${defender.name} ficou preso na tempestade de magma!`;
    else if (move.name === 'wrap' || move.name === 'bind') msg = `${defender.name} foi apertado!`;
    
    log(logs, msg, 'text-red-600 font-bold');
}

/**
 * Processa o dano residual e a duração do aprisionamento no final do turno.
 * O dano é 1/8 do HP máximo (ou 1/6 se o usuário tiver Binding Band - não implementado ainda).
 */
export function handleTrappingDamage(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    const trappingStatuses = [
        'bind', 'wrap', 'fire-spin', 'whirlpool', 'clamp', 
        'sand-tomb', 'magma-storm', 'infestation', 'snap-trap', 'thunder-cage'
    ];

    for (const status of trappingStatuses) {
        if (pokemon.statusEffects[status]) {
            // Aplica dano (1/8 do HP Máximo)
            // Se o usuário tiver Magic Guard, ele não toma este dano.
            if (pokemon.ability !== 'magic-guard') {
                const damage = Math.floor(pokemon.maxHP / 8) || 1;
                pokemon.hp = Math.max(0, pokemon.hp - damage);
                
                const moveName = pokemon.statusEffects[status].sourceMoveName || 'o ataque';
                log(logs, `${pokemon.name} sofreu dano por ${moveName}!`, 'text-red-500 italic text-xs');

                if (pokemon.hp === 0) {
                    pokemon.isFainted = true;
                    log(logs, BATTLE_MESSAGES.FAINTED(pokemon.name), 'text-red-900 font-bold');
                }
            }

            // Decrementa turnos
            pokemon.statusEffects[status].turns--;
            if (pokemon.statusEffects[status].turns <= 0) {
                delete pokemon.statusEffects[status];
                log(logs, `${pokemon.name} se libertou de ${status}!`, 'text-green-600 font-bold');
            }
            
            // Um Pokémon só pode ter um status de aprisionamento por vez, então paramos aqui
            break;
        }
    }
}