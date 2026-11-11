
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as StatChanges from '../effects/statChanges';
import * as NeutralizingGas from '../abilities/neutralizing_gas';

/**
 * Lógica para o movimento Bomba de Xarope (Syrup Bomb).
 * Regra Oficial: Cobre o alvo com xarope, reduzindo sua Velocidade em 1 estágio
 * no final de cada turno por 3 turnos.
 */
export function handleSyrupBombEffect(
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // Se já estiver coberto, reinicia o contador? 
    // Oficialmente: "If the target is already covered in syrup, the move fails."
    // Mas como é um efeito secundário de um golpe de dano, o dano ocorre e o efeito falha.
    if (defender.statusEffects['syrup-bomb']) {
        // Não loga falha explícita pois é efeito secundário, apenas não reaplica
        return;
    }

    // Aplica o status
    // Turns: 3.
    defender.statusEffects['syrup-bomb'] = { turns: 3 };
    
    log(logs, `${defender.name} ficou coberto de xarope pegajoso!`, 'text-green-600 font-bold italic');
}

/**
 * Processa o efeito no final do turno (redução de velocidade).
 */
export function handleSyrupBombTurnEnd(
    pokemon: Pokemon, 
    logs: LogEntry[],
    state?: BattleState
) {
    if (!pokemon.statusEffects['syrup-bomb'] || pokemon.isFainted) return;

    // Decrementa o contador
    pokemon.statusEffects['syrup-bomb'].turns--;

    // Aplica redução de Velocidade (-1)
    log(logs, `O xarope reduziu a velocidade de ${pokemon.name}!`, 'text-green-600 italic');
    
    // Ignora habilidades? Não necessariamente, mas o efeito é residual.
    // Usamos o applyMoveStatChange com isOpponentSource=false para simplificar (efeito de status)
    // ou true se considerarmos que veio do oponente. Como é status, geralmente Clear Body não bloqueia.
    // Mas Syrup Bomb é único. Vamos tratar como efeito de campo/status que não passa por checagem de habilidade padrão.
    
    // Na verdade, Clear Body BLOQUEIA Syrup Bomb stat drop.
    // Então precisamos passar isOpponentSource=true e verificar habilidades.
    // Porém, no final do turno, não temos referência fácil ao atacante original.
    // Assumimos que a "fonte" é o status.
    
    // Para simplificar e seguir a regra de Clear Body:
    // Passamos ignoresAbilities=false e isOpponentSource=true.
    
    StatChanges.applyMoveStatChange(
        pokemon,
        'speed-down',
        logs,
        true, // isOpponentSource (ativa checagem de Clear Body)
        false, // ignoresAbilities
        'syrup-bomb',
        state
    );

    // Se acabou os turnos
    if (pokemon.statusEffects['syrup-bomb'].turns <= 0) {
        delete pokemon.statusEffects['syrup-bomb'];
        log(logs, `${pokemon.name} se livrou do xarope!`, 'text-blue-500 font-bold');
    }
}
