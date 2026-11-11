
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Motor de Hádrons (Hadron Engine).
 * Regra Oficial: 
 * 1. Ao entrar, cria um Campo Elétrico (Electric Terrain).
 * 2. Aumenta o Atq. Especial do usuário em ~33% (1.3333x) se o Campo Elétrico estiver ativo.
 */

/**
 * Ativa a criação do terreno na entrada.
 */
export function triggerHadronEngineTerrain(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'hadron-engine' || pokemon.isFainted) return;

    if (state.terrain !== 'electric') {
        state.terrain = 'electric';
        state.terrainTurns = 5;
        if (pokemon.heldItem === 'terrain-extender') state.terrainTurns = 8;
        
        log(logs, `O Motor de Hádrons de ${pokemon.name} eletrificou o campo!`, 'text-yellow-500 font-bold italic');
    }
}

/**
 * Retorna o multiplicador de Atq. Especial.
 * O aumento é de aproximadamente 33% (fator 4096/3072 nos jogos originais, simplificado para 1.3333).
 */
export function getSpAttackMultiplier(pokemon: Pokemon, terrain: string): number {
    if (pokemon.ability === 'hadron-engine' && terrain === 'electric' && !pokemon.isFainted) {
        return 1.3333;
    }
    return 1.0;
}
