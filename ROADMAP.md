# Roadmap de Desenvolvimento — Pokémon Battle Simulator

## Como usar este arquivo

- Consulte este roadmap antes de cada rodada e execute somente o item solicitado.
- Depois das validações e antes do commit, atualize status, resultados e próximo item **no mesmo commit da tarefa**, sem criar um commit documental separado.
- Não grave o SHA do próprio commit neste arquivo: informe-o no resumo final depois do push. Não marque um item como concluído com regressões e sempre verifique a publicação antes do resumo.
- Mantenha `PROJECT_CONTEXT.md` atualizado a cada alteração.
- Para economizar tokens: inspecione somente os arquivos da tarefa e suas dependências diretas, reutilize a baseline registrada, use testes focados durante a iteração e rode a suíte completa na validação final. Não refaça auditorias globais já concluídas.

**Próximo item:** 1.4 — Cobrir trocas voluntárias, forçadas e por desmaio.

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

## Etapa 1 — Criar testes de caracterização antes da refatoração

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
- [ ] **1.4 — Cobrir trocas voluntárias, forçadas e por desmaio.**
- [ ] **1.5 — Cobrir replay manual, IA local e LLM mockado.**
- [ ] **1.6 — Cobrir IA em P1/P2 e batalha espelho com a mesma espécie.**
- [ ] **1.7 — Manter smoke tests automatizados de desenvolvimento e produção.**

## Etapa 2 — Consolidar o núcleo

- [ ] **2.1 — Manter um único `processTurnEnd` ativo e conectar os ticks existentes.**
- [ ] **2.2 — Unificar o fluxo de trocas, incluindo trocas forçadas.**
- [ ] **2.3 — Guiar roteadores por registro e testar o wiring dos golpes marcados como implementados.**
- [ ] **2.4 — Introduzir `instanceId` único, separado do ID da espécie.**
- [ ] **2.5 — Definir estado transacional, evitando snapshots com objetos mutáveis compartilhados.**
- [ ] **2.6 — Substituir o PRNG global por contexto explícito com snapshot/restore para simulações.**

## Etapa 3 — Refazer replay e simulação da IA sobre a base consolidada

- [ ] **3.1 — Reproduzir ações gravadas sem chamar IA para consumir RNG.**
- [ ] **3.2 — Versionar o formato e adicionar checkpoints ou hashes de estado por turno.**
- [ ] **3.3 — Preservar a identidade entre Pokémon ativo e entrada correspondente da equipe.**
- [ ] **3.4 — Parametrizar a IA pelo lado controlado e corrigir sua avaliação.**
- [ ] **3.5 — Fazer a simulação usar o mesmo coordenador, configuração e regras da batalha real.**

## Etapa 4 — Endurecimento e expansão

- [ ] **4.1 — Completar mecânicas faltantes após a base consolidada estar verde.**
- [ ] **4.2 — Conectar a importação de equipes no formato Showdown.**
- [ ] **4.3 — Melhorar acessibilidade, semântica dos diálogos e suporte a movimento reduzido.**
- [ ] **4.4 — Separar animações e estatísticas da interpretação frágil de strings de logs.**
- [ ] **4.5 — Dividir o bundle e remover o aviso informativo de chunk acima de 500 kB.**
- [ ] **4.6 — Ampliar a cobertura de habilidades, itens e integrações.**

## Registro resumido da baseline

- Última suíte integral informada: **29 arquivos e 97/97 testes aprovados**.
- `npm run lint`, `npm run build` e `git diff --check`: aprovados.
- Auditoria do item 0.5: **17 → 0** ocorrências no total e **6 → 0** em produção; instalação por `npm ci` reproduzida sem alterações nos manifestos.
- SHA dos itens 1.1, 1.2 e 1.3 informados somente no resumo final após o push; último SHA registrado no roadmap: `baae8a606c37495f30810e2c646dbb234c75ac86` (item 0.4).
- Pendência não bloqueante: aviso de chunk acima de 500 kB, planejado no item 4.5.
