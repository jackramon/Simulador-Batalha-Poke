
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Eletrogênese (Electric Surge).
 * Ao entrar em batalha, cria um Campo Elétrico.
 */
export function handleElectricSurge(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'electric-surge' || pokemon.isFainted) return;

    if (state.terrain !== 'electric') {
        state.terrain = 'electric';
        state.terrainTurns = 5;
        
        // Futura integração com item Terrain Extender poderia ser feita aqui
        
        log(logs, `A habilidade Eletrogênese de ${pokemon.name} eletrificou o campo!`, 'text-yellow-500 font-bold italic');
    }
}
