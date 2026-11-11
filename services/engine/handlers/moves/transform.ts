
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Transformar (Transform).
 * Regras Oficiais:
 * 1. O usuário copia os tipos, estágios de atributos e movimentos do alvo.
 * 2. O HP atual e o HP Máximo permanecem inalterados.
 * 3. Todos os movimentos copiados têm seus usos (PP) definidos como 5.
 * 4. Copia a aparência (sprite) do alvo.
 */
export function executeTransform(user: Pokemon, target: Pokemon, logs: { message: string, color: string }[]) {
    // Transformar falha se o usuário já estiver transformado
    if (user.statusEffects['transformed']) {
        log(logs, `Mas falhou! ${user.name} já está transformado!`, 'text-gray-500 italic');
        return;
    }

    // Copia Tipos
    user.types = [...target.types];

    // Copia Estágios de Atributos
    user.statStages = { ...target.statStages };

    // Copia Movimentos e reseta PP para 5
    user.moves = target.moves.map(move => ({
        ...move,
        uses: 5,
        maxUses: 5
    }));

    // Copia Aparência (Artwork e Pixel Art)
    user.spriteUrl = target.spriteUrl;
    user.backSpriteUrl = target.backSpriteUrl;
    user.pixelSpriteUrl = target.pixelSpriteUrl;

    // Registra o estado de transformação
    user.statusEffects['transformed'] = { turns: -1 };

    log(logs, `${user.name} se transformou em ${target.name}!`, 'text-purple-600 font-bold italic');
}
