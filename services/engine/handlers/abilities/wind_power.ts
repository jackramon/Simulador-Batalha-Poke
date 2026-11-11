import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';
import { WIND_MOVES } from '../../../../data/moves';

/**
 * Lógica para a habilidade Energia Eólica (Wind Power).
 * Regra Oficial: Torna o Pokémon "Carregado" (Charged) ao ser atingido por um movimento de vento.
 * O estado 'Charged' dobra o poder do próximo movimento do tipo Elétrico.
 */
export function handleWindPower(
    defender: Pokemon, 
    move: Move, 
    logs: {message: string, color: string}[]
) {
    if (defender.ability !== 'wind-power' || defender.isFainted) return;

    // Verifica se o movimento usado contra o portador é um movimento de vento
    if (WIND_MOVES.includes(move.name)) {
        if (!defender.statusEffects['charged']) {
            // Aplica o status 'charged' (reutilizando a chave da Eletromorfose)
            defender.statusEffects['charged'] = { turns: -1 };
            log(logs, `${defender.name} gerou eletricidade com o vento através de sua Energia Eólica!`, 'text-yellow-500 font-bold italic');
        }
    }
}
