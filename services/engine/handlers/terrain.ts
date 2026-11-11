
import { Pokemon, BattleState, Move } from '../../../types';
import { GRASSY_REDUCED_MOVES } from '../../../data/moves';
import * as NeutralizingGas from './abilities/neutralizing_gas';
import * as Klutz from './abilities/klutz';

/**
 * Verifica se o Pokémon está "aterrado" (grounded).
 * Pokémon aterrados são afetados por terrenos e recebem dano de golpes de terra (exceto Levitação).
 */
export function isGrounded(pokemon: Pokemon, state?: BattleState): boolean {
    if (!pokemon) return false;

    // 0. Gravidade (Prioridade Absoluta)
    // Se a gravidade estiver ativa, todos os Pokémon são aterrados, ignorando tipo Voador, Levitação, etc.
    if (state?.gravity) {
        return true;
    }

    // 1. Aterramento Prioritário (Gravity - não imp., Ingrain, Smack Down, Iron Ball)
    
    // Efeitos de Status que aterram explicitamente
    // 'smack-down' (Derrubada) ou 'ingrain' (Enraizar)
    if (pokemon?.statusEffects?.['ingrain'] || pokemon?.statusEffects?.['smack-down'] || pokemon?.statusEffects?.['grounded']) {
        return true;
    }

    // Iron Ball (Bola de Ferro) aterra o portador
    // Verifica se o item não está suprimido (Klutz, Magic Room, etc)
    if (pokemon?.heldItem === 'iron-ball') {
        if (!Klutz.isItemSuppressed(pokemon, state)) {
            return true;
        }
    }

    // 2. Imunidade ao Solo (Se não estiver aterrado forçadamente acima)

    // Levitação Magnética (Magnet Rise)
    if (pokemon?.statusEffects?.['magnet-rise']) {
        return false;
    }

    // Magnet Rise (Levitação Magnética) e Telekinesis (Telecinesia)
    if (pokemon?.statusEffects?.['magnet-rise'] || pokemon?.statusEffects?.['telekinesis']) {
        return false;
    }

    // Air Balloon (Balão de Ar) concede imunidade ao solo (se não estourado)
    if (pokemon?.heldItem === 'air-balloon') {
        if (!Klutz.isItemSuppressed(pokemon, state)) {
            return false;
        }
    }

    // Habilidade Levitate (Levitação)
    // Verifica se a habilidade está ativa e não suprimida (ex: Gás Neutralizante, Mold Breaker)
    if (pokemon?.ability === 'levitate') {
        // Se temos o estado da batalha, podemos verificar o Gás Neutralizante
        if (state) {
            if (NeutralizingGas.canAbilityTrigger(pokemon, state)) {
                return false;
            }
        } else {
            // Sem estado (fallback seguro), assume que a habilidade funciona
            return false;
        }
    }

    // Tipo Voador
    if (pokemon?.types?.includes('flying')) {
        // Efeito Roost (Pouso): Perde o tipo Voador temporariamente
        // Se estiver "roosting", ele é tratado como aterrado (ignora ser voador)
        if (pokemon?.statusEffects?.['roosting']) {
            return true;
        }
        return false;
    }

    // Por padrão, se não tem imunidades e não é Voador, é aterrado.
    return true;
}

/**
 * Retorna o multiplicador de dano baseado no terreno atual.
 */
export function getTerrainDamageMultiplier(attacker: Pokemon, defender: Pokemon, move: Move, terrain: BattleState['terrain']): number {
    const attackerGrounded = isGrounded(attacker);
    const defenderGrounded = isGrounded(defender);

    // Bônus Ofensivos (Atacante deve estar aterrado)
    if (attackerGrounded) {
        if (terrain === 'electric' && move.type === 'electric') return 1.3;
        if (terrain === 'grassy' && move.type === 'grass') return 1.3;
        if (terrain === 'psychic' && move.type === 'psychic') return 1.3;
    }

    // Reduções Defensivas (Defensor deve estar aterrado)
    if (defenderGrounded) {
        // Redução de golpes de Dragão no Misty Terrain
        if (terrain === 'misty' && move.type === 'dragon') return 0.5;
        
        // Reduções no Campo Gramado (EQ, Magnitude, Bulldoze)
        if (terrain === 'grassy' && GRASSY_REDUCED_MOVES.includes(move.name)) {
            return 0.5;
        }
    }
    
    return 1.0;
}

/**
 * Verifica se um movimento de prioridade deve ser bloqueado pelo Campo Psíquico.
 */
export function shouldBlockPriority(move: Move, attacker: Pokemon, defender: Pokemon, terrain: BattleState['terrain']): boolean {
    if (terrain !== 'psychic' || !isGrounded(defender)) return false;
    
    // Movimentos com prioridade positiva (> 0) contra alvos aterrados falham no Campo Psíquico.
    // Movimentos que atingem a si mesmo ou o campo (como Recover) não são bloqueados.
    const priority = move.priority || 0;
    if (priority > 0 && attacker !== defender) {
        return true;
    }
    
    return false;
}
