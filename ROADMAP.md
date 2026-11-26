# Roadmap de Desenvolvimento — Pokémon Battle Simulator

## Como usar este arquivo

- Consulte este roadmap antes de cada rodada e execute somente o item solicitado.
- Depois das validações e antes do commit, atualize status, resultados e próximo item **no mesmo commit da tarefa**, sem criar um commit documental separado.
- Não grave o SHA do próprio commit neste arquivo: informe-o no resumo final depois do push. Não marque um item como concluído com regressões e sempre verifique a publicação antes do resumo.
- Mantenha `PROJECT_CONTEXT.md` atualizado a cada alteração.
- Para economizar tokens: inspecione somente os arquivos da tarefa e suas dependências diretas, reutilize a baseline registrada, use testes focados durante a iteração e rode a suíte completa na validação final. Não refaça auditorias globais já concluídas.

**Próximo item:** 3.3 — Preservar a identidade entre Pokémon ativo e entrada correspondente da equipe.

## Etapa 0 — Restaurar uma baseline confiável

- [x] **0.1 — Corrigir a inicialização de produção e validar `npm start`.**
  - Wildcard do Express 5 corrigido, fallback da SPA preservado e APIs protegidas do fallback.
  - Commit: `275e2b61ebc21dcda764ff12d7637f959ff2e4ee`.
  - Validação publicada: teste de produção 1/1, lint e build aprovados.

- [x] **0.2 — Eliminar as falhas preexistentes de Howl.**
  - Expectativas dos testes alinhadas às mensagens canônicas do helper compartilhado, sem alterar o motor ou os logs de produção.
  - Commit: `0b10da7ac28eba013efbfb041ec74f6f81b7104f`.
  - Validação publicada: 21 arquivos e 49/49 testes aprovados, lint, build e `git diff --check` aprovados.

- [x] **0.3 — Corrigir o carregamento documentado das variáveis de ambiente.**
  - `.env.local` passou a ser carregado no início do servidor, em desenvolvimento e produção, com ausência tolerada, precedência do ambiente e logs do carregamento desativados.
  - Commit de implementação: `4e76fc87c156a16d09d650861b05d8f9a46c3b04`, com push verificado em `origin/main`.
  - Validação publicada: testes focados 4/4 e produção 1/1; 22 arquivos e 53/53 testes aprovados, lint, build Node 18 e `git diff --check` aprovados.

- [x] **0.4 — Restringir o proxy de LLM quando acessado pela rede.**
  - Bind em `127.0.0.1` por padrão com `LLM_PROXY_HOST` explícito; bloqueio remoto por socket em `/api/llm-action`; rate limit 429/`Retry-After` em LLM e catálogo; cancelamento real em OpenRouter, DeepSeek, catálogo e Gemini; allowlist de modelos aplicada às escolhas, ao catálogo e aos fallbacks.
  - Commit de implementação: `baae8a606c37495f30810e2c646dbb234c75ac86`, com push verificado em `origin/main`.
  - Validação publicada: 16 testes focados novos; 26 arquivos e 69/69 testes aprovados, lint, build Node 18 e `git diff --check` aprovados.

- [x] **0.5 — Avaliar as vulnerabilidades de dependências.**
  - Antes: 17 pacotes vulneráveis no total (2 baixas, 4 moderadas, 8 altas e 3 críticas) e 6 em produção (2 moderadas, 2 altas e 2 críticas), com cadeias separadas por `npm ls`.
  - Após dry-run, `npm audit fix` sem `--force` e atualização controlada de `tsx`; faixas do `package.json` e majors diretos preservados, sem edição manual do lockfile ou de `node_modules`.
  - Depois: 0 vulnerabilidades no total e 0 em produção, sem ocorrências residuais; `npm ci` reproduzível sem alterar os manifestos e `npm ls --all` sem problemas.
  - Validação: 6 arquivos e 21/21 testes focados do servidor/produção; 26 arquivos e 69/69 testes na suíte completa; lint, build e `git diff --check` aprovados.

## Etapa 1 — Criar testes de caracterização antes da refatoração — **Concluída**

**Status:** concluída em 24/11/2026 com o item 1.7.

- [x] **1.1 — Criar fixtures locais de batalha, sem dependência da PokeAPI.**
  - `tests/factories.ts` passou a oferecer builders tipados de `Move`, `Pokemon`, `StatStages`, `SideHazards`, `BagItem`, `PlayerInventory` e `BattleState` completo, com defaults determinísticos, overrides explícitos, independência entre instâncias e ativo inicial idêntico a `team[0]` (ou `null` em time vazio); `createDummy` permanece como alias caracterizado e sem uso de `as any`.
  - Testes novos em `tests/factories.test.ts`, em ciclos RED→GREEN por builder, cobrindo defaults válidos, overrides, independência de arrays/golpes/status/hazards/inventários, identidade referencial, determinismo e ausência de rede/`Math.random`/IndexedDB.
  - Validação: 7 arquivos e 32/32 testes focados; suíte completa 27 arquivos e 86/86 testes; `npm run lint`, `npm run build` e `git diff --check` aprovados. Nenhuma regra do motor foi alterada.
  - Commit: informado no resumo final após o push verificado em `origin/main`.
- [x] **1.2 — Cobrir turno completo com golpe, troca, item e estados de campo.**
  - `tests/integration/coordinator.test.ts` cobre o coordenador público sem React, PokeAPI ou rede, com helpers focados em `tests/integration/coordinator.helpers.ts`: `runCoordinatorTurn` consome o generator até `done` com seed explícita e restauração do PRNG em `finally`, e preserva por cópia o estado de cada fase.
  - Cenários: golpes dos dois lados; troca voluntária antes do golpe adversário; item de cura consumido do inventário e aplicado antes do dano; clima e terreno preservados com decremento das durações.
  - Validação: 4/4 testes focados; suíte completa 28 arquivos e 90/90 testes; `npm run lint`, `npm run build` e `git diff --check` aprovados. Nenhuma regra do motor foi alterada e nenhum defeito fora do escopo foi encontrado.
  - Commit: informado no resumo final após o push verificado em `origin/main`.
- [x] **1.3 — Cobrir hazards, telas e efeitos temporários, incluindo seus ticks.**
  - `tests/integration/hazardsAndFieldEffects.test.ts` adiciona sete caracterizações sobre estados injetados pelas fixtures: dano de Stealth Rock/Spikes e efeitos de Toxic Spikes/Sticky Web na troca, imunidade de voador aos hazards de chão, redução de dano por Reflect/Light Screen já ativos, e ticks de telas, Safeguard, Mist, Tailwind, Trick Room e Mud Sport, com preservação e expiração.
  - A ativação/wiring de Spikes/Stealth Rock/Sticky Web e Reflect/Light Screen, assim como ticks ainda ausentes de Wish, Yawn, Gravity e efeitos semelhantes, ficam explicitamente para 2.1/2.3 e não contam como cobertura aprovada nesta rodada.
  - Validação: 7/7 testes focados; suíte completa 29 arquivos e 97/97 testes; `npm run lint`, `npm run build` e `git diff --check` aprovados. Nenhuma regra do motor foi alterada.
  - Commit: informado no resumo final após o push verificado em `origin/main`.
- [x] **1.4 — Cobrir trocas voluntárias, forçadas e por desmaio.**
  - `tests/integration/switching.test.ts` adiciona quatro caracterizações: reset de estágios/voláteis e identidade com a equipe na troca voluntária; dano e sinalização de U-turn; `game-over` com vencedor correto sem reserva; e `faint-switch` sem vencedor prematuro, com dados do reserva e entrada separada por `performSwitch` sobre cópia profunda.
  - A cobertura de U-turn termina na sinalização atual de `switch-forced` e nos dados para a UI (`player`, `isBatonPass`, `canCancel`, estado e equipe). Ela **não certifica o fluxo oficial completo**: continuação após a escolha, processamento de ações pendentes/`turnEnd` e incremento do turno nesse fluxo permanecem lacunas.
  - Três `it.todo` registram a continuação da troca forçada, suas ações pendentes/`turnEnd` e a unificação de Roar, Dragon Tail e Red Card prevista para 2.2; essas lacunas não contam como cobertura aprovada e não foram convertidas em comportamento desejado.
  - Validação: 4 testes focados aprovados e 3 `it.todo`; suíte completa com 30 arquivos, 101 testes aprovados e 3 `it.todo` (104 registrados); `npm run lint`, `npm run build` e `git diff --check` aprovados. Nenhuma regra de produção foi alterada e nenhum helper novo foi necessário.
  - Commit: informado no resumo final após o push verificado em `origin/main`.
- [x] **1.5 — Cobrir replay manual, IA local e LLM mockado.**
  - `tests/integration/replayAndAi.test.ts` adiciona cinco caracterizações sem alterar produção ou criar helpers: replay manual reconstrói troca de P1 e golpe de P2 a partir de `BattleReplayEvent`, repetindo a mesma seed e comparando decisões, ordem das ações, snapshots de fase e estado final completo, incluindo HP, PP, turno e identidade ativo/equipe no núcleo.
  - `decideAIAction` para P2 produz duas vezes a mesma ação exata com estado pequeno e seed redefinida antes de cada execução; cada chamada restaura o `Math.random` em `finally`. O LLM usa apenas `fetch` stubado e `Response` local, cobrindo golpe válido, troca válida e fallback para o primeiro golpe com PP após resposta inválida, sem chamadas externas.
  - Dois `it.todo` mantêm como lacunas, sem congelar defeitos em assertivas: replay com LLM executando IA local indevidamente (3.1) e identidade ativo/equipe quebrada no `ReplayPlayer` (3.3). Os três `it.todo` anteriores permanecem, e a integração/correção desses fluxos pertence a 3.1/3.3.
  - Validação: 5 testes focados aprovados e 2 `it.todo`; suíte completa com 31 arquivos, 106 testes aprovados e 5 `it.todo` (111 registrados); `npm run lint`, `npm run build` e `git diff --check` aprovados. Nenhuma regra de produção foi alterada.
  - Commit: informado no resumo final após o push verificado em `origin/main`.
- [x] **1.6 — Cobrir IA em P1/P2 e batalha espelho com a mesma espécie.**
  - `tests/integration/aiSidesAndMirror.test.ts` adiciona duas caracterizações sem alterar produção ou criar helpers: P2 escolhe um golpe com PP disponível, mantém `playerNum: 2` e usa seed explícita com restauração do PRNG em `finally`; a batalha espelho executa um golpe simples com a mesma espécie/ID nos dois lados e ações por `playerNum`, confirmando HP, PP, ativos e vencedor sem confusão.
  - Um `it.todo` de 3.4 registra a escolha legal de P1 com `playerNum: 1`, alvo correto e avaliação para o próprio lado. Outros dois registram Tailwind/Tera/Mega/hazards/telas e IA/LLM em espelho, cuja correção depende do `instanceId` em 2.4 e da parametrização da IA em 3.4; nenhum comportamento incorreto foi aprovado.
  - Validação: 2 testes focados aprovados e 3 `it.todo`; suíte completa com 32 arquivos, 108 testes aprovados e 8 `it.todo` (116 registrados), preservando os cinco todos anteriores; `npm run lint`, `npm run build` e `git diff --check` aprovados. Nenhuma regra de produção foi alterada.
  - Commit: informado no resumo final após o push verificado em `origin/main`.
- [x] **1.7 — Manter smoke tests automatizados de desenvolvimento e produção.**
  - `tests/server/development.test.ts` executa o `npm run dev` real em porta efêmera no loopback, com ambiente de segurança isolado e bloqueio de rede externa; polling HTTP com timeout confirma a SPA e `/@vite/client`, e `/api/llm-action` responde localmente sem provedor externo.
  - O encerramento remove a árvore `cmd`/npm/tsx/node no Windows e o grupo de processos nas demais plataformas; polling de bind comprova a liberação da porta. O smoke de produção foi preservado sem alterações e nenhum helper compartilhado novo foi necessário.
  - Validação: smokes de desenvolvimento e produção isolados com 1/1 teste cada; suíte completa com 33 arquivos, 109 testes aprovados e 8 `it.todo` (117 registrados), preservando todos os todos anteriores; `npm run lint`, `npm run build` e `git diff --check` aprovados. Nenhuma regra de produção foi alterada.
  - Commit: informado no resumo final após o push verificado em `origin/main`.

## Etapa 2 — Consolidar o núcleo

- [x] **2.1 — Manter um único `processTurnEnd` ativo e conectar os ticks existentes.**
  - `services/engine/turnEnd.ts` é a fonte única; `services/engine/handlers/turnEnd.ts` reexporta a mesma função para compatibilidade.
  - Gravity, Water Sport, Wonder Room, Magic Room, Embargo, Laser Focus, Uproar, Ingrain, Curse, Wish e Yawn foram conectados sem alterar wiring de golpes, clima, terreno ou chamadas aleatórias dos caminhos já ativos.
  - `tests/integration/turnEndTicks.test.ts` adiciona 14 testes pelo coordenador público, cobrindo decremento/expiração, timing de Wish/Yawn, tick único, efeitos anteriores e identidade da reexportação.
  - Validação: 14/14 testes focados novos; suíte completa com 34 arquivos, 123 testes aprovados e 8 `it.todo` (131 registrados); `npm run lint`, `npm run build` e `git diff --check` aprovados. Todos os todos anteriores foram preservados.
  - Commit: informado no resumo final após o push verificado em `origin/main`.
- [x] **2.2 — Unificar o fluxo de trocas, incluindo trocas forçadas.**
  - `performSwitch` é o caminho compartilhado de saída, hazards, habilidades de entrada e clima; Roar/Whirlwind, Dragon Tail/Circle Throw e Red Card delegam suas transições a ele sem novos draws de PRNG.
  - O generator do coordenador recebe a escolha da UI após `switch-forced`, aplica uma única troca e retoma as ações pendentes do mesmo turno; `useTurnManager` somente encaminha essa escolha. `turnEnd` e incremento ocorrem uma única vez, sem reiniciar o turno.
  - Golpes de Pokémon que já saíram são eliminados da fila por identidade referencial e sinais de troca já consumidos não emitem prompt duplicado. Trocas voluntárias, Baton Pass, desmaio/`faint-switch`, vitória e identidade ativo/equipe permanecem cobertos.
  - Os três `it.todo` de switching viraram testes em ciclos RED→GREEN; aliases, golpe adversário no substituto, entrada/hazards únicos e replay com mesma seed/ações também foram verificados.
  - Validação: 2 arquivos focados, 18 testes aprovados e 2 `it.todo` de outros itens; suíte completa com 34 arquivos, 132 testes aprovados e 5 `it.todo` (137 registrados); `npm run lint`, `npm run build` e `git diff --check` aprovados.
  - Commit: informado no resumo final após o push verificado em `origin/main`.
- [x] **2.3 — Guiar roteadores por registro e testar o wiring dos golpes marcados como implementados.**
  - `services/engine/handlers/effects/statusMoveRegistry.ts` é a fonte declarativa única das rotas especiais, com referências diretas e adaptadores tipados; o router preserva somente os fallbacks genéricos legítimos, sem exigir handlers para dano ou status simples.
  - A paridade estrutural contra o router anterior congelado cobre 130 golpes e 118 handlers, e o registro valida funções, nomes não vazios e ausência de duplicados. `IMPLEMENTED_MOVES` não foi usado como prova de funcionamento.
  - Spikes, Stealth Rock, Sticky Web, Toxic Spikes, Reflect, Light Screen, Aurora Veil, Trick Room, Gravity, Safeguard, Mist e Lucky Chant foram conectados pelo fluxo público. Os testes cobrem lado correto, camadas máximas 3/2, entrada com hazards, redução de dano, neve para Aurora Veil, duração e expiração.
  - O tick de Lucky Chant reside em seu handler e é executado pela fonte canônica `processTurnEnd`; o coordenador consome esse resultado sem chamada adicional. A ativação pelo registry com duração inicial 5, o wiring, switching, `instanceId`, PRNG e `secondaryEffectRouter` não foram alterados.
  - Fechamento validado por RED→GREEN: a chamada direta a `processTurnEnd` cobre 2→1→0 sem nova ativação, e o coordenador preserva a ativação em 5 com exatamente um decremento por turno até 0. Validação: 4 arquivos focados e 35 testes aprovados; suíte completa com 36 arquivos, 146 testes aprovados e 5 `it.todo` preservados (151 registrados), sem novos todos; `npm run lint`, `npm run build` e `git diff --check` aprovados.
  - Commit: informado no resumo final após o push verificado em `origin/main`.
- [x] **2.4 — Introduzir `instanceId` único, separado do ID da espécie.**
  - `Pokemon.id` permanece como espécie/PokeAPI; `instanceId` é preenchido/normalizado deterministicamente por lado e slot, sem PRNG, em PokeAPI, builder, importação, fixtures e replay. IDs existentes únicos são preservados, colisões são resolvidas deterministicamente, e clones/trocas mantêm a identidade.
  - Lados e alvos passaram a ser resolvidos por instância em Tailwind, hazards, telas, Tera, Mega, mochila/itens, trocas, efeitos de equipe, hidratação Mega e IA local/LLM. IDs de espécie usados por sprites, formas e PokeAPI foram preservados.
  - Novos eventos gravam `actorInstanceId`, `switchInstanceId` e `targetInstanceId`; itens também transportam `targetInstanceId` nas ações. `services/replayLogic.ts` reidrata instâncias sem ambiguidade e aceita replay antigo por espécie apenas quando houver um único candidato. A normalização do replay não altera a separação ativo/equipe do ReplayPlayer, adiada para 3.3; a estratégia da IA de P1 permanece em 3.4.
  - Cinco grupos RED→GREEN cobriram unicidade/estabilidade, mecânicas laterais em espelho, mochila/Tera/Mega, IA/LLM e replay novo/fallback antigo, incluindo duplicatas importadas, trocas, persistência da identidade e ausência de draws adicionais nos caminhos de identidade. Os dois `it.todo` de espelho deste item foram convertidos; os três todos de 3.1/3.3/3.4 permanecem.
  - Validação: 6 arquivos focados e 37 testes aprovados com 1 `it.todo`; suíte completa com 39 arquivos, 159 testes aprovados e 3 `it.todo` (162 registrados); `npm run lint`, `npm run build` e `git diff --check` aprovados.
  - Commit: informado no resumo final após o push verificado em `origin/main`.
- [x] **2.5 — Definir estado transacional, evitando snapshots com objetos mutáveis compartilhados.**
  - `services/engine/stateTransactions.ts` centraliza clones estruturais, propriedade de drafts ativos, continuidade de resultados rasos internos e reidratação de Pokémon, golpes e ações por `instanceId`. `runTurn`, `executeMove`, `performSwitch` e `processTurnEnd` trabalham em drafts próprios; chamadas aninhadas reutilizam somente a transação já ativa e a fronteira proprietária a encerra sem congelar produção.
  - O coordinator clona cada `TurnStepResult` no yield, preservando `currentPokemon === team[i]` dentro do snapshot e impedindo referências compartilhadas com fases futuras. Ações externas e escolhas de troca retomadas de snapshots da UI são reidratadas no draft, inclusive em espelho, U-turn e Baton Pass.
  - Cinco fronteiras seguiram RED→GREEN, com uma prova adicional para `movedThisTurn` do segundo usuário. Sete testes novos cobrem entradas profundamente congeladas, HP/PP, equipes/status/hazards, snapshots, identidade, ausência de aliases, replay duplo com a mesma seed/ações e contagens fixas de 4/4/2 draws nos cenários de espelho/U-turn/Baton Pass. Baton Pass, desmaio, vitória e os três `it.todo` anteriores foram preservados.
  - Validação: 7/7 testes focados novos; suíte completa com 40 arquivos, 166 testes aprovados e 3 `it.todo` (169 registrados); `npm run lint`, `npm run build` e `git diff --check` aprovados. O primeiro smoke integral de produção sofreu timeout sob contenção, passou isolado e a repetição integral ficou verde; permanece o aviso preexistente de chunk acima de 500 kB.
  - Dependência fora do escopo registrada para 3.4/3.5: a avaliação ótima da IA local deverá consumir explicitamente os estados transacionais retornados. A IA e o ReplayPlayer não foram editados; a caracterização existente de IA mantém legalidade, lado, PP e determinismo sem fixar a escolha do golpe de maior poder.
- [x] **Hotfix prioritário antes de 2.6 — Corrigir identidade da Mega, impedir Mega+Tera e restaurar o pós-KO.**
  - Causa raiz reproduzida: a hidratação de `megaProfile` separava `currentPokemon` de `team[i]`; a reidratação transacional operava na equipe enquanto o snapshot do ativo ficava base/desatualizado. A restauração de identidade agora ocorre na hidratação, na persistência e na fronteira transacional.
  - Nome, sprites, tipos, stats, habilidade, HP e `isFainted` da Mega chegam ao mesmo objeto canônico consumido pelo card/cena. Mega tem precedência quando chega com Tera; Tera não é consumida, estados já transformados são respeitados e o LLM tem suas flags normalizadas. A guarda da IA local foi preservada.
  - Ações com atacante/alvo desmaiado são recusadas sem PP, dano ou logs. O gerenciador aguarda a troca pós-KO; com reserva há um único `faint-switch` e entrada do substituto, e sem reserva há `game-over`. `instanceId`, PRNG, snapshots e replay determinístico permanecem cobertos.
  - RED inicial: 8 falhas e 4 caracterizações; após a correção: 12/12 testes novos. Suítes relacionadas: 32 aprovados e 2 todos antigos. Suíte completa: 41 arquivos, 178 aprovados e 3 todos antigos (181 registrados); `npm run lint`, `npm run build` e `git diff --check` aprovados. Nenhum `it.todo` novo.
  - Smoke real no navegador com fixture local: `Mega Swampert` e sprite MEGA no card com 48/176 HP; após o segundo turno, `Lucario` 300/300, um desmaio da Mega, uma troca, nenhum dano 0/desmaio repetido, nenhum erro de console e porta do servidor liberada. Permanece somente o aviso preexistente de chunk acima de 500 kB.
- [x] **Hotfix prioritário antes de 2.6 — Isolar sessões e impedir resoluções duplicadas.**
  - Duas raízes independentes comprovadas: falta de identidade de sessão permitia que continuações/timers/IA da batalha anterior escrevessem estado, logs, persistência, replay, ações ou consumissem PRNG na nova; a troca forçada manual no `App` executava `performSwitch` fora do generator, deixava o `switch-forced` suspenso e permitia uma segunda resolução com a ação antiga de P2.
  - `services/battleSession.ts` centraliza `sessionId`, `resolutionId`, turno, cancelamento de timers, abort de animações e liberação do await forçado. `startBattle`/reset/fuga invalidam antes dos awaits; commits, persistência, replay e ações validam o dono da sessão/resolução. O mutex impede resolução concorrente e aceita apenas a escolha solicitada pelo próprio `switch-forced`.
  - `TurnAnimator` recebe `AbortSignal`; IA, animações e delays são cancelados/ignorados deterministicamente. A retomada manual de Emergency Exit/U-turn consome o resolver exatamente uma vez e o `faint-switch` de 2.2/hotfix anterior permanece externo.
  - O updater React pode rodar depois do `finally`; por isso `canCommitResolution` distingue resolução ativa de dono do último commit, evitando tanto escrita tardia quanto perda do commit final (`waitingForAction` preso).
  - RED→GREEN cobriu escrita tardia após KO residual, IA antiga sem alterar seed/estado, duplicidade por chegada de ação durante Emergency Exit, turno 25 único, clima não expirado duas vezes, Nickit sem registrar desmaio de Lilligant e desmaiado que não retorna. Testes focados: 6/6. Suíte completa: 43 arquivos, 184 aprovados e 3 `it.todo` antigos (187 registrados); lint, build e `git diff --check` aprovados; nenhum `it.todo` novo.
  - Smoke no preview de produção: fixture do turno 25, Poção em Slugma, IA usando Tempestade de Folhas, Emergency Exit manual para Nickit, turno 26 com um início/uma ação/um `turnEnd`, clima 1 e `waitingForAction: false`; fuga e segunda batalha iniciada no turno 1, sem erros de console e com portas liberadas. Permanece somente o aviso preexistente de chunk acima de 500 kB.
- [x] **Hotfix prioritário antes de 2.6 — Entregar o commit terminal após `game-over`.**
  - Causa raiz reproduzida no `App`: `updateStateWithLogs` recebia o passo terminal, mas `terminate()` podia invalidar a resolução antes da execução do updater React; `canCommitResolution` descartava `winner`/encerramento e deixava a UI processando.
  - `BattleSession` reserva uma única entrega terminal antes do encerramento e a aceita após `finishResolution()` sem liberar commits comuns; invalidar/iniciar sessão revoga a reserva e bloqueia escritas antigas. Dano, PRNG, U-turn, Emergency Exit, Mega e faint-switch não foram alterados.
  - RED→GREEN na fronteira coordinator → `useTurnManager` → React/`localStorage`: 6 testes de UI cobrem vitória de ambos os lados, KO residual, empate, commit único, ausência de ações pós-terminal e nova batalha; 2 testes adicionais cobrem concessão/revogação. Suítes relacionadas: 43/43; suíte completa: 45 arquivos, 192 aprovados e 3 `it.todo` antigos (195 registrados), sem novos todos; lint, build e `git diff --check` aprovados.
  - Smoke real de produção com Nidoking em 1 HP e sem reservas: Folhagem causou o KO, a vitória substituiu “Processando combate...”, Nova Batalha/Exportar Replay ficaram disponíveis e não houve erros de console. Outra batalha começou limpa no turno 1 com 300/1 HP, sem restaurar o resultado anterior; porta liberada. O launcher previamente validado integra o mesmo commit.
- [x] **2.6 — Substituir o PRNG global por contexto explícito com snapshot/restore para simulações.**
  - `BattlePRNG` mantém seed, estado interno e cursor em `BattleState.prngState`, formato clonável/JSON sem métodos; a instância é recriada/injetada nas fronteiras transacionais, com `snapshot`, `restore` e `fork`. `seed`/`turnSeed` legados são aceitos, e o monkeypatch/singleton global foi removido.
  - Coordinator, actions, movePipeline, turnEnd, switching, handlers de golpes/habilidades/itens/status, IA, ReplayPlayer e persistência usam o contexto explícito. Geração de equipes antes da seed, apresentação visual, `services/api/factory.ts` e `services/battleEngine.ts` legado sem importadores permanecem fora da migração.
  - Cada simulação da IA recebe fork próprio, sem alterar avaliação ou estados retornados (3.4/3.5); o cursor real antes/depois de `decideAIAction` permanece igual. Duas batalhas intercaladas, persistência/restauração no meio e replay com mesma seed/ações reproduzem os mesmos snapshots e estado final.
  - Oito ouros da versão anterior cobrem precisão, crítico, dano mínimo/máximo, status, clima, desempate e troca aleatória com contagens fixas de draws. Os 20 testes novos também cobrem instâncias independentes, `Math.random` nativo sem influência, fork/snapshot/restore e guarda estática de `Math.random`/singleton nos caminhos ativos.
  - Validação: 20/20 testes focados novos; suíte completa com 49 arquivos, 212 aprovados e 3 `it.todo` antigos (215 registrados); `npm run lint`, `npm run build` e `git diff --check` aprovados. Permanece o aviso informativo preexistente de chunk acima de 500 kB.
  - Smoke real no bundle de produção: duas batalhas consecutivas iniciadas no turno 1, vitória por KO de Nidoking e replay exportado/reproduzido até 1/1 com os mesmos eventos e desfecho, sem erros de console; porta de teste liberada.
  - Próximo item: 3.1. Commit: informado no resumo final após o push verificado em `origin/main`.

## Etapa 3 — Refazer replay e simulação da IA sobre a base consolidada

- [x] **3.1 — Reproduzir ações gravadas sem chamar IA para consumir RNG.**
  - `ReplayPlayer` e `replayLogic` não importam nem chamam decisões de IA; a reprodução usa somente seed, estado/cursor e eventos gravados.
  - P1/P2 manual, IA local, LLM, golpes, itens, trocas voluntárias, forçadas e por desmaio são reidratados do replay, com flags Tera/Mega, alvos e `moveName` por `instanceId`. U-turn/Baton Pass retomam o mesmo generator, e a troca pós-desmaio isolada não executa outro turno.
  - Replays antigos sem decisão necessária exibem `Replay incompatível` sem IA/fetch ou ação inventada; apenas `recharge`/`struggle` mantêm o fallback temporário. A IA automática de P1 grava as flags da própria decisão, sem depender do toggle visual.
  - O `it.todo` de 3.1 virou teste no player real para IA local e LLM mockado, comparando ações, snapshots, cursor e estado final ao vivo versus replay. RED→GREEN adicionais cobriram troca forçada, desmaio, item e compatibilidade.
  - Validação: 4 arquivos focados com 22 aprovados e 1 `it.todo`; suíte completa com 50 arquivos, 220 aprovados e 2 `it.todo` (222 registrados); lint, build e `git diff --check` aprovados.
  - Smoke no bundle de produção: IA local e LLM mockado reproduzidos até 1/1, Nidoking em 0/1 PV, log de desmaio, zero chamadas `/api/` e zero erros; porta liberada. Permanece o aviso preexistente de chunk acima de 500 kB.
  - Próximo item: 3.2. Commit: informado no resumo final após o push verificado em `origin/main`.
- [x] **3.2 — Versionar o formato e adicionar checkpoints ou hashes de estado por turno.**
  - `REPLAY_FORMAT_VERSION = 1` e `REPLAY_ENGINE_REVISION = '3.2.0'` passam a identificar o arquivo; replays sem `formatVersion` são lidos explicitamente como legado e recebem aviso de ausência de verificação.
  - Cada exportação versionada traz checkpoint inicial (`turn 0`) e um checkpoint por turno concluído, com `turn`, `prngState` (`{ seed, state, cursor }`) e `stateHash`, sem snapshots completos por turno.
  - A canonicalização inclui equipes, ativos, HP, status, estágios, PP, campo, hazards, inventário, vencedor e PRNG; exclui logs, apresentações e flags efêmeras de UI. A serialização ordena chaves e é estável com reordenação e `structuredClone`.
  - O hash é FNV-1a de 32 bits com prefixo `fnv1a32`, síncrono e idêntico em Node e navegador, sem nova dependência.
  - Versão futura é rejeitada na leitura; a reprodução recalcula e compara checkpoints e interrompe na primeira divergência informando turno, hash esperado e hash obtido.
  - Validação: 3 arquivos focados e 20 testes aprovados; suíte completa com 52 arquivos, 234 aprovados e 2 `it.todo` (236 registrados); `npm run lint`, `npm run build` e `git diff --check` aprovados.
  - Smoke no bundle de produção: exportação real com `formatVersion 1`, `engineRevision 3.2.0`, checkpoint inicial e do turno 1; reprodução até `Turno: 1 / 1` sem alerta e sem chamadas `/api/`; cópia corrompida detectada no turno 1 com hash esperado e obtido; porta liberada.
- [x] **Hotfix prioritário antes de 3.3 — Corrigir checkpoints prematuros e hidratação Mega em replays válidos.**
  - Causa raiz reproduzida: a gravação normal lia `stateRef.current`, potencialmente anterior às ações quando a animação não rendia ao React. Os dois draws ausentes no arquivo eram os `tieBreaker` das duas ações; na seed do relato, os estados/cursores 2→4 e `3663702483`→`3031866813` foram reproduzidos exatamente. Não houve execução duplicada nem draw adicional.
  - `useTurnManager` grava o último snapshot emitido pelo coordinator; o terminal já usava esse snapshot. O player verifica o checkpoint do turno concluído correspondente e o painel de ações usa o turno dos eventos, não `state.turn` já incrementado. U-turn, troca pós-desmaio e terminal permanecem cobertos.
  - O smoke revelou uma segunda origem de hash: a hidratação assíncrona de `megaProfile` podia ocorrer após o checkpoint inicial e antes do turno. Checkpoints agora podem transportar `megaProfiles` por `instanceId`; o player aplica esses dados locais antes do turno correspondente, sem fetch/IA, sem alterar hashes e sem modificar `formatVersion = 1`.
  - Replays 3.2.0 com checkpoints finais corretos continuam aceitos. Um checkpoint 3.2.0 comprovadamente pré-ação é identificado e interrompido com orientação explícita de regravação: o arquivo não contém o hash final original e não pode ser reparado sem aceitar adulterações. O replay afetado precisa ser regravado; nenhum arquivo é reescrito e nenhuma validação é desativada.
  - RED→GREEN cobriu draws por sessão/resolução/ação, troca+`aerodactylite`, turno seguinte, cursores em todos os checkpoints, hidratação tardia, U-turn, desmaio, terminal, cópia corrompida, seed adulterada e compatibilidade. Validação: 3 arquivos focados e 25 testes aprovados; suíte completa com 52 arquivos, 239 aprovados e 2 `it.todo` antigos (241 registrados); `npm run lint`, `npm run build` e `git diff --check` aprovados, sem novos todos.
  - Smoke real no bundle: batalha de dois turnos com troca+`aerodactylite` e terminal; exportação 3.2.1 com seed 336430, cursores 0/4/10 e perfil Mega somente nos checkpoints 1/2; replay até 2/2 com rótulo do turno 1; cópia com item alterada rejeitada no turno 1; zero requests durante replay, zero erros de console e porta liberada. A hidratação ao vivo fez somente a chamada esperada a `aerodactyl-mega`.
  - Próximo item: 3.3. Commit: informado no resumo final após o push verificado em `origin/main`.
- [ ] **3.3 — Preservar a identidade entre Pokémon ativo e entrada correspondente da equipe.**
- [ ] **3.4 — Parametrizar a IA pelo lado controlado e corrigir sua avaliação.**
  - Dependência de 2.5: adaptar a avaliação para consumir os `newState`/snapshots transacionais; a caracterização de 1.5 passou a fixar legalidade e determinismo, não a escolha do golpe de maior poder.
- [ ] **3.5 — Fazer a simulação usar o mesmo coordenador, configuração e regras da batalha real.**

## Etapa 4 — Endurecimento e expansão

- [ ] **4.1 — Completar mecânicas faltantes após a base consolidada estar verde.**
- [ ] **4.2 — Conectar a importação de equipes no formato Showdown.**
- [ ] **4.3 — Melhorar acessibilidade, semântica dos diálogos e suporte a movimento reduzido.**
- [ ] **4.4 — Separar animações e estatísticas da interpretação frágil de strings de logs.**
- [ ] **4.5 — Dividir o bundle e remover o aviso informativo de chunk acima de 500 kB.**
- [ ] **4.6 — Ampliar a cobertura de habilidades, itens e integrações.**

## Registro resumido da baseline

- Última suíte integral informada: **52 arquivos, 239 testes aprovados e 2 `it.todo`** (241 registrados); os todos são lacunas de 3.3/3.4 e não contam como cobertura aprovada.
- `npm run lint`, `npm run build` e `git diff --check`: aprovados.
- Auditoria do item 0.5: **17 → 0** ocorrências no total e **6 → 0** em produção; instalação por `npm ci` reproduzida sem alterações nos manifestos.
- SHA dos itens 1.1 a 1.7 e dos itens 2.1/2.2/2.3/2.4/2.5 informados somente nos respectivos resumos finais após o push; último SHA registrado no roadmap: `baae8a606c37495f30810e2c646dbb234c75ac86` (item 0.4).
- Pendência não bloqueante: aviso de chunk acima de 500 kB, planejado no item 4.5.
