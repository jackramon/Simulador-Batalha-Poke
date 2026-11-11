# Instruções do Projeto Pokémon Battle Simulator

Sempre que você for realizar alterações arquiteturais, adicionar novas mecânicas, corrigir bugs complexos ou modificar a UI, você **DEVE** primeiro ler o arquivo `PROJECT_CONTEXT.md` na raiz do projeto.

O arquivo `PROJECT_CONTEXT.md` contém:
- A arquitetura modular do projeto.
- Regras estritas sobre Determinismo e PRNG (crucial para o sistema de Replays e IA).
- Diretrizes de UI/UX e mecânicas já implementadas.
- O Registro de Alterações (Changelog).

**Regra de Ouro:** Após concluir qualquer alteração solicitada pelo usuário, você deve **ATUALIZAR** o arquivo `PROJECT_CONTEXT.md` adicionando um breve resumo da sua alteração na seção "Registro de Alterações (Changelog)". Isso garante que o contexto do projeto permaneça sempre atualizado para futuras interações.

**Regra de Zero Regressão:** Sempre que você fizer alguma alteração, deve garantir **ZERO REGRESSÃO** no que já foi implementado. Nenhuma funcionalidade existente (como habilidades, itens, mecânicas de clima, replay, etc.) deve ser quebrada ao adicionar novas features.
