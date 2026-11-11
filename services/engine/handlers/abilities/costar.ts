import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Coestrelato (Costar).
 * Regra Oficial: Ao entrar em batalha, o Pokémon copia as mudanças de atributos do aliado.
 * No simulador 1v1, ele copia do Pokémon que acabou de sair do campo (seja por troca ou nocaute).
 */
export function handleCostar(
    pokemon: Pokemon, 
    lastPokemon: Pokemon | null, 
    logs: {message: string, color: string}[]
): boolean {
    if (pokemon.ability !== 'costar' || !lastPokemon) {
        return false;
    }

    // Verifica se havia alguma mudança de atributo para copiar (estágios diferentes de 0)
    const hasChanges = Object.values(lastPokemon.statStages).some(stage => stage !== 0);

    if (hasChanges) {
        // Copia todos os estágios (Ataque, Defesa, Especial, Velocidade, Precisão e Evasiva)
        pokemon.statStages = { ...lastPokemon.statStages };
        
        log(logs, `${pokemon.name} copiou as mudanças de atributos de ${lastPokemon.name} com seu Coestrelato!`, 'text-indigo-600 font-bold italic');
        return true;
    }

    return false;
}
