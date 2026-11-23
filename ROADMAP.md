# Roadmap de Desenvolvimento — Pokémon Battle Simulator

## Como usar este arquivo

- Consulte este roadmap antes de cada rodada e execute somente o item solicitado.
- Atualize o item concluído depois das validações e do push verificado, registrando commit e resultado dos testes.
- Não marque um item como concluído enquanto houver regressões ou publicação pendente.
- Mantenha `PROJECT_CONTEXT.md` atualizado a cada alteração.
- Para economizar tokens: inspecione somente os arquivos da tarefa e suas dependências diretas, reutilize a baseline registrada, use testes focados durante a iteração e rode a suíte completa na validação final. Não refaça auditorias globais já concluídas.

**Próximo item:** 0.4 — Restrição do proxy de LLM quando acessado pela rede.

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

- [ ] **0.4 — Restringir o proxy de LLM quando acessado pela rede.**
  - Avaliar e implementar proteção de acesso, rate limit, timeouts e allowlist de modelos sem quebrar os provedores e fallbacks existentes.

- [ ] **0.5 — Avaliar as vulnerabilidades de dependências.**
  - Separar produção e desenvolvimento, aplicar atualizações controladas e validar zero regressão; não executar atualizações cegas em massa.

## Etapa 1 — Criar testes de caracterização antes da refatoração

- [ ] **1.1 — Criar fixtures locais de batalha, sem dependência da PokeAPI.**
- [ ] **1.2 — Cobrir turno completo com golpe, troca, item e estados de campo.**
- [ ] **1.3 — Cobrir hazards, telas e efeitos temporários, incluindo seus ticks.**
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

- Última suíte integral informada: **22 arquivos e 53/53 testes aprovados**.
- `npm run lint`, `npm run build` e `git diff --check`: aprovados.
- Último commit de implementação validado e publicado: `4e76fc87c156a16d09d650861b05d8f9a46c3b04`.
- Pendência não bloqueante: aviso de chunk acima de 500 kB, planejado no item 4.5.
