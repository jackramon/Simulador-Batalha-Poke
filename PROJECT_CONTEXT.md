# Contexto do Projeto: Simulador de Batalhas Pokémon

## 1. Visão Geral
Este é um simulador de batalhas Pokémon 1v1 construído com React, TypeScript e Tailwind CSS. O simulador suporta mecânicas até a Geração 9 (incluindo Terastalização) e mecânicas legadas como Mega Evolução. Possui um sistema de IA avançado (Minimax com Expectimax) e um sistema de Replay determinístico.

## 2. Arquitetura e Estrutura de Diretórios
A arquitetura é estritamente modular para evitar arquivos monolíticos.
- **`components/`**: Componentes de UI (React).
  - `App.tsx`: Ponto de entrada, configuração da batalha, seleção de times.
  - `BattleLayout.tsx`: Layout principal da batalha (HP, status, sprites).
  - `PokemonCard.tsx`: Exibição detalhada do Pokémon, botões de ação (ataques, switch, itens).
  - `ReplayPlayer.tsx`: Reprodutor de replays determinístico.
- **`services/engine/`**: Motor da batalha.
  - `coordinator.ts`: Orquestra o fluxo do turno (Fase de Ações, Execução, Fim de Turno).
  - `movePipeline.ts`: Pipeline de execução de movimentos (Precisão -> Imunidades -> Dano -> Efeitos Secundários).
  - `actions.ts`: Resolução de prioridades e speed ties.
  - `handlers/`: Lógica isolada.
    - `abilities/`: Implementações específicas de habilidades (ex: `intimidate.ts`, `gale_wings.ts`).
    - `moves/`: Movimentos com lógicas complexas (ex: `lastResort.ts`, `outrage.ts`).
    - `items/`: Efeitos de itens.
    - `effects/`: Roteadores de efeitos secundários e status.
- **`services/aiLogic.ts`**: Inteligência Artificial. Usa Minimax para prever turnos e Expectimax para lidar com chances de acerto (Accuracy).
- **`data/`**: Bancos de dados estáticos (JSON/TS) para Pokémon, Movimentos, Habilidades, Itens e Traduções (PT-BR).
- **`hooks/`**:
  - `useBattleState.ts`: Gerencia o estado global da batalha.
  - `useTurnManager.ts`: Processa as intenções dos jogadores e aciona o motor.
- **`utils/prng.ts`**: Gerador de Números Pseudo-Aleatórios (PRNG) determinístico. **CRÍTICO** para replays.

## 3. Regras de Ouro (Mecânicas e Código)
1. **Determinismo Absoluto (PRNG)**:
   - **NUNCA** use `Math.random()` diretamente em lógicas que afetam o resultado da batalha (dano, precisão, efeitos, desempates de velocidade, IA).
   - O sistema de Replay depende de uma semente (seed) inicial. Qualquer chamada extra ao PRNG que ocorra apenas na simulação da IA ou fora de ordem dessincronizará o replay.
   - Desempates de velocidade (Speed Ties) usam uma propriedade `tieBreaker` pré-calculada na interface `Action`.
2. **Modularidade (Zero Regressão)**:
   - Ao adicionar uma nova habilidade, movimento ou item, crie um arquivo dedicado em `services/engine/handlers/` e importe-o no roteador correspondente (ex: `entry.ts`, `damageModifiers.ts`, `turnEnd.ts`).
   - Não adicione `if/else` gigantes em `movePipeline.ts` ou `battleEngine.ts`.
   - **GARANTIA DE ZERO REGRESSÃO:** Nenhuma funcionalidade existente deve ser quebrada ao adicionar novas features.
3. **Imutabilidade do Estado**:
   - O estado da batalha (`BattleState`) deve ser clonado antes de simulações (IA).
   - Atualizações no React devem seguir os paradigmas de imutabilidade.

## 4. Layout e Visuais (UI/UX)
- **Estilização**: Tailwind CSS.
- **Cores**: Baseadas nos tipos dos Pokémon (ex: Fogo = vermelho/laranja, Água = azul). As cores são definidas dinamicamente usando classes do Tailwind (ex: `bg-red-500`).
- **Animações**: Gerenciadas pelo `TurnAnimator` e transições CSS. Evite bloquear a thread principal.
- **Logs**: O componente `InteractiveLogMessage` exibe o histórico da batalha com cores contextuais (ex: dano super efetivo, curas, ativação de habilidades).

## 5. Mecânicas Implementadas
- **Clima (Weather)**: Sun, Rain, Sandstorm, Snow/Hail, Desolate Land, Primordial Sea, Delta Stream.
- **Terreno (Terrain)**: Electric, Grassy, Misty, Psychic.
- **Status**: Burn, Freeze, Paralysis, Poison, Toxic, Sleep, Confusion, Flinch, Leech Seed, Taunt, Encore, Torment, Disable, etc.
- **Hazards**: Stealth Rock, Spikes, Toxic Spikes, Sticky Web.
- **Geração 9**: Terastalização (muda o tipo defensivo e potencializa STAB).
- **Geração 6**: Mega Evolução (muda stats, tipo e habilidade).

## 6. Registro de Alterações (Changelog)
- **23/06/2026**: Implementação de loop avançado de auto-regeneração (self-healing) para OpenRouter na API. Se o modelo gratuito inicial (como `google/gemini-2.5-flash:free` ou `meta-llama/llama-3-8b-instruct:free`) for descontinuado, desabilitado ou estiver indisponível temporariamente na plataforma OpenRouter, o backend Express agora consulta dinamicamente a API oficial da OpenRouter para coletar todos os modelos ativos que estão marcados como gratuitos no momento. Ele então tenta sequencialmente até 4 modelos gratuitos alternativos (como `google/gemma-2-9b-it:free`, `mistralai/mistral-7b-instruct:free`, `qwen/qwen-2-7b-instruct:free`, etc.) antes de recorrer ao cascateamento nativo do Gemini. Além disso, a validação de ações no frontend foi aperfeiçoada para ser completamente tolerante a variações de grafia e capitalização dos movimentos sugeridos pelas IAs, garantindo zero ocorrências de falhas do tipo "Invalid action from LLM".
- **23/06/2026**: Tratamento de exceção para chaves de API inválidas/expiradas do Google Gemini. Agora, se a chave do Gemini embutida no ambiente ou fornecida pelo usuário estiver com erro de autenticação (como `API_KEY_INVALID` ou `INVALID_ARGUMENT`), o servidor intercepta a falha de forma graciosa e devolve uma mensagem de erro em português totalmente legível e amigável que orienta o usuário a configurar sua chave na aba Settings, em vez de lançar erros brutos de JSON na API.
- **23/06/2026**: Correção de erros críticos de taxa limite (429 Rate Limit) e formato de JSON de IA. Adicionado mecanismo robusto de cascata (Gemini Cascade Fallback): se o OpenRouter ou DeepSeek falharem devido a rate limits ou falha de chave, a requisição é automaticamente direcionada ao Google Gemini nativo. Criado o parser inteligente de JSON `extractJson` no frontend/services capaz de remover tags de raciocínio de IA (como `<think>...</think>` do DeepSeek R1) e ignorar avisos de segurança/preâmbulos, extraindo apenas o objeto JSON válido da resposta.
- **23/06/2026**: Implementação de sistema auto-regenerativo (self-healing) de modelos no OpenRouter. Agora o servidor Express intercepta erros de modelos indisponíveis/pagos (como `meta-llama/llama-3-8b-instruct:free` ou `deepseek-r1`) e faz fallback automático e instantâneo para o modelo gratuito mais estável (`google/gemini-2.5-flash:free`). Adicionado o endpoint dinâmico `/api/openrouter-models` que consulta os modelos disponíveis em tempo real diretamente do OpenRouter, atualizando o dropdown da UI de forma dinâmica e eliminando o risco de quebras por mudanças nas cotas gratuitas do provedor.
- **23/06/2026**: Correção das falhas de modelos indisponíveis/pagos no OpenRouter. Adicionadas opções gratuitas robustas e estáveis como `google/gemini-2.5-flash:free` (definido como novo padrão grátis recomendado), `meta-llama/llama-3-8b-instruct:free` e `mistralai/mistral-7b-instruct:free`. Também implementado um campo de texto dinâmico na UI de configuração para que o usuário possa digitar livremente qualquer slug de modelo customizado do OpenRouter, prevenindo que alterações futuras na grade do provedor quebrem o simulador.
- **23/06/2026**: Adicionado suporte modular a provedores alternativos de IA Real (OpenRouter e DeepSeek Oficial). Agora o usuário pode escolher em um dropdown visual qual IA deseja usar para controlar os jogadores: Google Gemini (nativo/grátis), OpenRouter (que disponibiliza Qwen 2.5/DeepSeek R1 de graça) ou DeepSeek Oficial direto. Criado `.env.example` para documentar as novas chaves `OPENROUTER_API_KEY` e `DEEPSEEK_API_KEY`.
- **23/06/2026**: Correção do "Script error." no navegador ao remover a tag `importmap` redundante e a referência ao `/index.css` inexistente em `index.html`. O `importmap` forçava a resolução de módulos (como React) via CDN (esm.sh), o que causava conflitos de escopo/versão com o bundle nativo gerado pelo Vite e resultava em erros Cross-Origin mascarados.
- **23/06/2026**: Correção do erro de linter em `types.ts` tornando a propriedade `useLLM` opcional (`useLLM?`) na interface `BattleConfig`. Isso evita falhas de compilação em mockups e configurações de testes que não utilizam IA baseada em LLM.
- **10/04/2026**: Implementação da IA Real (LLM) utilizando a API do Gemini. Adicionada a opção `useLLM` na configuração da batalha e no frontend para permitir que os jogadores sejam controlados por uma IA baseada em LLM. A lógica da IA foi isolada em `services/llmAiLogic.ts` para garantir zero regressão com a IA determinística existente.
- **10/04/2026**: Adicionada a regra de Zero Regressão no `AGENTS.md` e `PROJECT_CONTEXT.md`.
- **10/04/2026**: Criação do arquivo de contexto do projeto (`PROJECT_CONTEXT.md`) e injeção das instruções em `AGENTS.md` para garantir consistência e evitar regressões em alterações futuras.
- **21/03/2026**: Correção crítica de dessincronização de Replays. Implementado `tieBreaker` determinístico para Speed Ties, cache de `calculatedPriority` e isolamento do PRNG nas simulações da IA (Minimax). Adicionado `handleEntryAbilities` na inicialização do Replay.
