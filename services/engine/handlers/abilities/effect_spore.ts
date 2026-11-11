
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import * as StatusEffect from '../../../effectHandlers';
import * as Overcoat from './overcoat';

/**
 * Lógica para a habilidade Esporos de Efeito (Effect Spore).
 * 30% de chance total (10% Veneno, 10% Paralisia, 10% Sono) de causar um status 
 * ao ser atingido por um movimento de contato.
 * Pokémon do tipo Grama, com a habilidade Sobretudo ou segurando Safety Goggles são imunes.
 */
export function handleEffectSpore(attacker: Pokemon, defender: Pokemon, logs: {message: string, color: string}[]) {
    // Imunidades a esporos/pós (Geração 6+)
    const isImmuneToPowder = 
        attacker.types.includes('grass') || 
        Overcoat.isImmuneToPowderEffects(attacker) || 
        attacker.heldItem === 'safety-goggles';

    if (isImmuneToPowder || attacker.isFainted) {
        return;
    }

    const rand = Math.random();
    if (rand < 0.3) {
        let status = '';
        if (rand < 0.1) status = 'sleep';
        else if (rand < 0.2) status = 'poison';
        else status = 'paralysis';

        log(logs, `Os Esporos de Efeito de ${defender.name} se espalharam!`, 'text-green-600 font-bold');
        StatusEffect.applyStatus(attacker, status, logs as any, defender);
    }
}
