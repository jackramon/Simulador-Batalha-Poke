
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Soundproof from '../abilities/soundproof';

/**
 * Inicia o efeito da Canção Mortal (Perish Song).
 * Regra Oficial: Todos os Pokémon em campo que ouvirem a canção desmaiam em 3 turnos.
 * Habilidade À Prova de Som (Soundproof) protege contra o efeito.
 */
export function handlePerishSongStart(attacker: Pokemon, logs: LogEntry[], state: BattleState) {
    const targets = [state.currentPokemon1, state.currentPokemon2].filter(p => p && !p.isFainted) as Pokemon[];
    
    log(logs, `Todos os Pokémon que ouvirem a canção desmaiarão em 3 turnos!`, 'text-red-800 font-bold italic');

    targets.forEach(target => {
        // Verifica Imunidade (Soundproof)
        // isImmune retorna true se tiver a habilidade Soundproof
        if (Soundproof.isImmune(target, 'perish-song', false)) {
            // Nota: Em jogos oficiais, não aparece mensagem específica de imunidade para cada um,
            // mas o Pokémon simplesmente não recebe o status.
            return;
        }

        // Se já estiver sob efeito, não reinicia
        if (target.statusEffects['perish-song']) {
             return; 
        }
        
        // Aplica o status
        // A contagem começa em 4. 
        // Final do Turno 1 (Uso): Decrementa para 3. Log: "Contagem caiu para 3".
        // Final do Turno 2: Decrementa para 2. Log: "Contagem caiu para 2".
        // Final do Turno 3: Decrementa para 1. Log: "Contagem caiu para 1".
        // Final do Turno 4: Decrementa para 0. Faint.
        target.statusEffects['perish-song'] = { 
            turns: 4,
            isVolatile: true,
            batonPassable: true
        };
    });
}

/**
 * Processa a contagem regressiva do efeito Perish Song (Canção Mortal).
 * Usado pelo movimento Perish Song e pela habilidade Perish Body.
 * Chamado no turnEnd.ts.
 */
export function handlePerishCount(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.isFainted || !pokemon.statusEffects['perish-song']) return;

    pokemon.statusEffects['perish-song'].turns--;
    const count = pokemon.statusEffects['perish-song'].turns;

    if (count === 0) {
        log(logs, `A contagem de ${pokemon.name} chegou a 0!`, 'text-gray-800 font-bold');
        pokemon.hp = 0;
        pokemon.isFainted = true;
        log(logs, BATTLE_MESSAGES.FAINTED(pokemon.name), 'text-red-900 font-bold');
        delete pokemon.statusEffects['perish-song'];
    } else {
        log(logs, `A contagem de ${pokemon.name} caiu para ${count}!`, 'text-gray-600 italic');
    }
}
