
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Hidratação (Hydration).
 * Regra Oficial: Cura qualquer condição de status não-volátil no final de cada turno se estiver chovendo.
 */
export function handleHydration(pokemon: Pokemon, weather: BattleState['weather'], logs: {message: string, color: string}[]): boolean {
    if (pokemon.ability !== 'hydration' || weather !== 'rain' || pokemon.isFainted) {
        return false;
    }

    const majorStatus = ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'];
    const hasMajorStatus = Object.keys(pokemon.statusEffects).some(s => majorStatus.includes(s));

    if (hasMajorStatus) {
        majorStatus.forEach(s => {
            if (pokemon.statusEffects[s]) {
                delete pokemon.statusEffects[s];
            }
        });
        log(logs, `${pokemon.name} curou seus status com sua Hidratação sob a chuva!`, 'text-blue-500 font-bold');
        return true;
    }
    
    return false;
}
