
import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as Klutz from '../abilities/klutz';

// Espécies imunes à Telecinesia (baseado no nome em minúsculo)
// Inclui Diglett, Dugtrio, Sandygast, Palossand e Mega Gengar
const IMMUNE_SPECIES = [
    'diglett', 'dugtrio', 'sandygast', 'palossand', 'gengar-mega'
];

/**
 * Lógica para o movimento Telecinesia (Telekinesis).
 * Regra Oficial: 
 * 1. Faz o alvo flutuar por 3 turnos.
 * 2. O alvo torna-se imune a movimentos do tipo Terra.
 * 3. Todos os movimentos usados contra o alvo ignoram checagem de precisão (exceto OHKO).
 * 4. Falha se o alvo já estiver sob efeito, enraizado (Ingrain/Smack Down), segurando Iron Ball ou for uma espécie imune.
 */
export function handleTelekinesis(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // 1. Verifica se já está sob efeito
    if (defender.statusEffects['telekinesis']) {
        log(logs, `Mas falhou! ${defender.name} já está levitando.`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica Ingrain ou Smack Down (Smack Down aterra e impede levitação)
    if (defender.statusEffects['ingrain'] || defender.statusEffects['smack-down'] || defender.statusEffects['grounded']) {
        log(logs, `Mas falhou! ${defender.name} está preso ao chão.`, 'text-gray-500 italic');
        return;
    }

    // 3. Verifica Iron Ball (se não tiver Klutz)
    if (defender.heldItem === 'iron-ball' && !Klutz.isItemSuppressed(defender, state)) {
        log(logs, `Mas falhou! A Bola de Ferro pesa demais.`, 'text-gray-500 italic');
        return;
    }

    // 4. Verifica Espécies Imunes
    const speciesName = defender.name.toLowerCase();
    const isImmuneSpecies = IMMUNE_SPECIES.some(s => speciesName.includes(s));
    
    if (isImmuneSpecies) {
        log(logs, `Mas falhou! Não funciona em ${defender.name}.`, 'text-gray-500 italic');
        return;
    }

    // 5. Aplica o efeito (3 turnos)
    defender.statusEffects['telekinesis'] = { turns: 3 };
    log(logs, `${defender.name} foi levitado com telecinesia!`, 'text-purple-600 font-bold');
}
