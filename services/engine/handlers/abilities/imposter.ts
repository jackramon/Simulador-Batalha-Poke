
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as TransformMove from '../moves/transform';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Impostor (Imposter).
 * Regra Oficial: O Pokémon se transforma no oponente imediatamente ao entrar em batalha.
 * A transformação copia stats (exceto HP), movimentos, habilidade, tipo e aparência.
 */
export function handleImposter(
    pokemon: Pokemon, 
    opponent: Pokemon | null, 
    logs: {message: string, color: string}[], 
    state: BattleState
) {
    // 1. Validações básicas
    if (pokemon.ability !== 'imposter' || pokemon.isFainted || !opponent || opponent.isFainted) {
        return;
    }

    // 2. Verifica se a habilidade está suprimida pelo Gás Neutralizante
    if (state && !NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return;
    }

    // 3. Verifica condições que impedem a transformação (Oponente já transformado, ilusão ativa, etc)
    // Nota: TransformMove.executeTransform já verifica se o USUÁRIO está transformado.
    // Aqui verificamos se o ALVO é válido.
    if (opponent.statusEffects['transformed'] || opponent.statusEffects['illusion'] || opponent.statusEffects['substitute']) {
        // Na prática, Impostor falha silenciosamente nestes casos ou exibe mensagem específica se tentado.
        // No simulador, vamos apenas não executar.
        return;
    }

    log(logs, `O Impostor de ${pokemon.name} foi ativado!`, 'text-purple-600 font-bold italic');

    // 4. Executa a transformação usando a lógica centralizada do movimento Transformar
    TransformMove.executeTransform(pokemon, opponent, logs);
}
