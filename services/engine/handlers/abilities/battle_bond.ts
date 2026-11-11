
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Laço de Batalha (Battle Bond).
 * Regra Gen 9: Quando o Pokémon nocauteia um oponente, seu Ataque, Atq. Especial e Velocidade
 * aumentam em 1 estágio.
 * Restrição: Só ativa uma vez por batalha.
 * Nota: Na Gen 9, não há transformação visual em Ash-Greninja, apenas boost de stats.
 */
export function handleBattleBond(attacker: Pokemon, logs: LogEntry[]) {
    if (attacker.ability !== 'battle-bond' || attacker.isFainted) return;

    // Verifica se já ativou nesta batalha
    if (attacker.statusEffects['battle-bond-active']) return;

    // Marca como ativado (Persistente)
    attacker.statusEffects['battle-bond-active'] = { turns: -1 };

    let boosted = false;

    // Aumenta Ataque
    if (attacker.statStages.attack < 6) {
        attacker.statStages.attack++;
        boosted = true;
    }
    // Aumenta Atq. Especial
    if (attacker.statStages.spAttack < 6) {
        attacker.statStages.spAttack++;
        boosted = true;
    }
    // Aumenta Velocidade
    if (attacker.statStages.speed < 6) {
        attacker.statStages.speed++;
        boosted = true;
    }

    if (boosted) {
        log(logs, `O Laço de Batalha de ${attacker.name} foi ativado! Seus atributos aumentaram!`, 'text-blue-600 font-bold italic');
    }
}
