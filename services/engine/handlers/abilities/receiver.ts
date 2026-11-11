
import { Pokemon } from '../../../../types';
import { ABILITY_EFFECTS } from '../../../../data/abilities';
import { log } from '../../utils';

/**
 * Lista de habilidades que NÃO podem ser copiadas por Receptor/Poder da Alquimia (Oficial Gen 9).
 */
const NON_COPYABLE_ABILITIES = [
    'receiver', 'power-of-alchemy', 'trace', 'illusion', 'wonder-guard', 
    'zen-mode', 'stance-change', 'shields-down', 'schooling', 'comatose', 
    'disguise', 'rks-system', 'battle-bond', 'gulp-missile', 'ice-face', 
    'neutralizing-gas', 'as-one', 'zero-to-hero', 'commander', 'tera-shell', 
    'teraform-zero', 'poison-puppeteer', 'multitype', 'hunger-switch'
];

/**
 * Lógica para Receptor (Receiver) / Poder da Alquimia (Power of Alchemy).
 * Em 1v1 com times, ativa ao entrar no lugar de um aliado que acabou de desmaiar.
 */
export function handleReceiver(
    pokemon: Pokemon, 
    lastPokemon: Pokemon | null, 
    logs: {message: string, color: string}[]
): boolean {
    const receiverAbilities = ['receiver', 'power-of-alchemy'];
    
    if (!receiverAbilities.includes(pokemon.ability) || !lastPokemon || !lastPokemon.isFainted) {
        return false;
    }

    const abilityToCopy = lastPokemon.ability;

    // Verifica se a habilidade do aliado é válida para cópia
    if (abilityToCopy && !NON_COPYABLE_ABILITIES.includes(abilityToCopy)) {
        const abilityName = ABILITY_EFFECTS[abilityToCopy]?.name || abilityToCopy;
        const receiverName = ABILITY_EFFECTS[pokemon.ability]?.name || pokemon.ability;
        
        log(logs, `${pokemon.name} herdou o ${abilityName} de ${lastPokemon.name} através de ${receiverName}!`, 'text-indigo-600 font-bold italic');
        
        // Copia a habilidade
        pokemon.ability = abilityToCopy;
        return true;
    }

    return false;
}
