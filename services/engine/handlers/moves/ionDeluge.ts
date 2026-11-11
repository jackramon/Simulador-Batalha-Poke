import { Pokemon, BattleState, LogEntry, Move } from '../../../../types';
import { log } from '../../utils';

export function handleIonDeluge(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state: BattleState
) {
    if (state.ionDelugeActive) {
        log(logs, `Uma chuva de íons já cobre o campo de batalha!`, 'text-gray-500 italic');
        return;
    }

    state.ionDelugeActive = true;
    log(logs, `Uma chuva de íons cobriu o campo de batalha!`, 'text-yellow-500 font-bold');
}

export function getEffectiveMoveType(
    state: BattleState | undefined,
    move: Move
): string {
    // Ion Deluge transforma movimentos do tipo Normal em Elétrico.
    // Afeta apenas movimentos de dano ou status? A descrição oficial diz "Normal-type moves become Electric-type".
    // Geralmente afeta tudo, mas a implementação de Galvanize/Pixilate/etc. costuma excluir status moves para evitar bugs.
    // No entanto, Ion Deluge é um efeito de campo.
    // Bulbapedia: "Ion Deluge causes all Normal-type moves used by any Pokémon to become Electric-type for the remainder of the turn."
    // Não menciona restrição de categoria. Mas para segurança e consistência com outras mecânicas de mudança de tipo no simulador,
    // vamos manter a verificação de damageClass se as outras tiverem.
    // Verificando Galvanize: "move.damageClass !== 'status'".
    // Vamos seguir o padrão para evitar problemas com golpes de status virando elétricos e causando paralisia indevida ou algo assim.
    
    if (state?.ionDelugeActive && move.type === 'normal') {
        return 'electric';
    }
    return move.type;
}
