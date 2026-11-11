import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import * as Comatose from './comatose';

/**
 * Lógica para a habilidade Pesadelos (Bad Dreams).
 * Regra Oficial: Causa dano (1/8 do HP máximo) a oponentes que estejam dormindo no final do turno.
 */
export function handleBadDreams(
    source: Pokemon,
    target: Pokemon | null,
    logs: {message: string, color: string}[]
) {
    if (source.ability !== 'bad-dreams' || source.isFainted || !target || target.isFainted) {
        return;
    }

    // Verifica se o alvo está efetivamente dormindo (Status Sleep ou Habilidade Comatose)
    const isAsleep = !!target.statusEffects.sleep || Comatose.isTreatedAsAsleep(target);

    if (isAsleep) {
        // Habilidade Magic Guard impede dano indireto
        if (target.ability === 'magic-guard') {
            return;
        }

        const damage = Math.floor(target.maxHP / 8) || 1;
        target.hp = Math.max(0, target.hp - damage);
        
        log(logs, `${target.name} está sofrendo com Pesadelos!`, 'text-purple-800 italic');

        if (target.hp === 0) {
            target.isFainted = true;
            log(logs, `${target.name} desmaiou devido aos Pesadelos!`, "text-red-900 font-bold");
        }
    }
}
