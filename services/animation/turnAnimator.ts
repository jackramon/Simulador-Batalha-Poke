
import { TurnStepResult } from '../engine/coordinator';

// Interface para as ações de UI necessárias pelo animador
// Isso mantém o animador desacoplado da implementação específica do React
export interface AnimationUIActions {
    setAnimationState: (state: { id: number; type: 'attack' | 'damage' | 'poison' | 'burn' | 'paralysis' | 'sleep' | 'freeze' | 'confusion' | 'infatuation' | 'flinch' } | null) => void;
}

export class TurnAnimator {
    /**
     * Processa um passo do turno e executa animações visuais apropriadas.
     * Retorna uma Promise que resolve quando a animação termina.
     * GARANTIA: Sempre resolve, nunca rejeita ou trava, para não bloquear o loop do jogo.
     */
    static async processStep(step: TurnStepResult, uiActions: AnimationUIActions, playbackSpeed: number = 1): Promise<void> {
        try {
            const active1 = step.state.currentPokemon1;
            const active2 = step.state.currentPokemon2;

            // --- FASE: ANTES DA AÇÃO (Animação de Ataque ou Falha por Status) ---
            if (step.phase === 'before-action' && step.actionType === 'move') {
                if (step.activeActorId) {
                    uiActions.setAnimationState({ id: step.activeActorId, type: 'attack' });
                    await new Promise(r => setTimeout(r, 400 / playbackSpeed));
                    uiActions.setAnimationState(null);
                }
            }

            // --- DETECÇÃO DE INTERRUPÇÃO POR STATUS (Paralisia/Sono/Congelamento/Confusão/Paixão/Recuo) ---
            // Verifica os logs para encontrar mensagens de impedimento de movimento
            let statusInterruption = false;
            
            for (const log of step.logs) {
                let animType: 'paralysis' | 'sleep' | 'freeze' | 'confusion' | 'infatuation' | 'flinch' | null = null;
                let delay = 1000;

                // Paralisia
                if (log.message.includes('está paralisado e não pode se mover') || log.message.includes('is paralyzed! can\'t move')) {
                     animType = 'paralysis';
                     delay = 1000;
                }
                // Sono
                else if (log.message.includes('está dormindo') || log.message.includes('is fast asleep')) {
                     animType = 'sleep';
                     delay = 1200;
                }
                // Congelamento
                else if (log.message.includes('está congelado') || log.message.includes('is frozen solid')) {
                     animType = 'freeze';
                     delay = 1000;
                }
                // Confusão
                else if (log.message.includes('está confuso') || log.message.includes('is confused') || log.message.includes('se feriu na confusão') || log.message.includes('hurt itself in confusion')) {
                     animType = 'confusion';
                     delay = 1200;
                }
                // Paixão (Infatuation)
                else if (log.message.includes('está apaixonado') || log.message.includes('is in love') || log.message.includes('imobilizado pelo amor')) {
                     animType = 'infatuation';
                     delay = 1200;
                }
                // Recuo (Flinch)
                else if (log.message.includes('recuou e não atacou') || log.message.includes('flinched and couldn\'t move')) {
                     animType = 'flinch';
                     delay = 800; // Recuo é um pouco mais rápido
                }

                if (animType) {
                     // Tenta identificar quem sofreu o status.
                     // Geralmente é o activeActorId do passo atual se for uma tentativa de movimento falha.
                     // Se não, tentamos pelo nome.
                     let victimId = step.activeActorId;

                     if (!victimId) {
                         if (active1 && log.message.includes(active1.name)) victimId = active1.id;
                         else if (active2 && log.message.includes(active2.name)) victimId = active2.id;
                     }

                     if (victimId) {
                         uiActions.setAnimationState({ id: victimId, type: animType });
                         await new Promise(r => setTimeout(r, delay / playbackSpeed)); // Tempo para animação tocar
                         uiActions.setAnimationState(null);
                         statusInterruption = true;
                         break; // Anima apenas uma vez por passo para não travar
                     }
                }
            }
            
            // --- FASE: APÓS AÇÃO (Animação de Dano) ---
            // Só anima dano se não foi um turno de interrupção por status (evita conflito visual)
            if (step.phase === 'after-action' && !statusInterruption) {
                if (step.damageDealt && step.targetId) {
                    uiActions.setAnimationState({ id: step.targetId, type: 'damage' });
                    await new Promise(r => setTimeout(r, 1200 / playbackSpeed)); 
                    uiActions.setAnimationState(null);
                } else {
                    // Pequeno delay para leitura se não houver dano
                    await new Promise(r => setTimeout(r, 800 / playbackSpeed)); 
                }
            }
            
            // --- FASE: FIM DO TURNO (Dano Residual / Status) ---
            else if (step.phase === 'turn-end') {
                // Analisa logs para identificar danos passivos
                for (const log of step.logs) {
                     let targetId: number | null = null;
                     let animType: 'poison' | 'burn' | null = null;

                     // Detecta mensagens de dano residual
                     if (log.message.includes('sofreu') && log.message.includes('dano devido')) {
                         if (log.message.includes('Veneno') || log.message.includes('Tóxico')) {
                             animType = 'poison';
                         } else if (log.message.includes('Queimadura')) {
                             animType = 'burn';
                         }

                         if (animType) {
                             // Tenta identificar o alvo pelo nome no log
                             if (active1 && log.message.includes(active1.name)) targetId = active1.id;
                             else if (active2 && log.message.includes(active2.name)) targetId = active2.id;
                         }
                     }

                     if (targetId && animType) {
                         uiActions.setAnimationState({ id: targetId, type: animType });
                         await new Promise(r => setTimeout(r, 1000 / playbackSpeed)); // Tempo para animação tocar
                         uiActions.setAnimationState(null);
                     }
                }
            }
        } catch (error) {
            console.error("Erro no TurnAnimator:", error);
            // Fallback: garante que o estado de animação seja limpo se algo der errado
            uiActions.setAnimationState(null);
        }
    }
}
