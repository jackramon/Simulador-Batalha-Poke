
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Corpo Perecível (Perish Body).
 * Regra Oficial: Quando atingido por um movimento de contato, tanto o Pokémon 
 * com esta habilidade quanto o atacante desmaiam em 3 turnos.
 */
export function handlePerishBody(
    defender: Pokemon, 
    attacker: Pokemon, 
    isContact: boolean, 
    logs: {message: string, color: string}[]
) {
    // Requisitos: Defensor ter a habilidade, ser contato, ambos estarem vivos
    if (defender.ability !== 'perish-body' || !isContact || defender.isFainted || attacker.isFainted) {
        return;
    }

    // A habilidade não afeta Pokémon que já estão sob efeito de Perish Song
    let triggered = false;

    if (!defender.statusEffects['perish-song']) {
        defender.statusEffects['perish-song'] = { 
            turns: 4,
            isVolatile: true,
            batonPassable: true
        }; // Começa em 4 para cair para 3 no final do turno
        triggered = true;
    }

    if (!attacker.statusEffects['perish-song']) {
        attacker.statusEffects['perish-song'] = { 
            turns: 4,
            isVolatile: true,
            batonPassable: true
        }; // Começa em 4 para cair para 3 no final do turno
        triggered = true;
    }

    if (triggered) {
        log(logs, `Ambos os Pokémon morrerão em 3 turnos devido ao Corpo Perecível de ${defender.name}!`, 'text-purple-800 font-black italic');
    }
}
