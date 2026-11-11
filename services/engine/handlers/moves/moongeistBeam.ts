
import { Move } from '../../../../types';

/**
 * Verifica se um movimento ignora as habilidades do defensor.
 * Aplica-se a movimentos como Moongeist Beam, Sunsteel Strike e Photon Geyser.
 */
export function ignoresAbilities(move: Move): boolean {
    return [
        'moongeist-beam', 
        'sunsteel-strike', 
        'photon-geyser',
        'tera-starstorm' // Estelar também tende a ter propriedades únicas, mas oficial: Moongeist/Sunsteel/Photon
    ].includes(move.name);
}
