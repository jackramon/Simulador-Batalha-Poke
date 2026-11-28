<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1m42kPQjiBa3rF93xKb6FKtogaXeR9Hvu

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key.
   The server loads this file automatically in development and production. Variables already set by the system or AI Studio take precedence, and `.env.local` is ignored by Git.
3. Run the app:
   `npm run dev`

## Importar e exportar equipes no formato Showdown

O seletor de equipe de cada jogador tem a opção **📥 Importar Equipe (Showdown)**, separada da importação JSON. Ela aceita o texto colado ou um arquivo `.txt` no formato de sets do Pokémon Showdown:

```text
Acerola (Mimikyu) (F) @ Life Orb
Ability: Disguise
Level: 50
Shiny: Yes
Tera Type: Fairy
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
IVs: 0 SpA
- Shadow Claw
- Play Rough
- Swords Dance
- Protect
```

Campos suportados por Pokémon: espécie, apelido, gênero (`(M)`/`(F)`), item, habilidade, nível, Shiny, Tera Type, EVs, IVs, Natureza e de 1 a 4 golpes. Metadados do Showdown que não afetam a batalha (`Happiness`, `Ball`, `Dynamax Level`, `Gigantamax`, `Hidden Power`) são aceitos e ignorados.

Regras aplicadas na importação:

- A equipe precisa ter **exatamente** a quantidade escolhida em "Qtd. Pokémon" (1, 3 ou 6). Nada é importado parcialmente.
- Os seis atributos saem do caminho canônico (`services/api/factory.ts` + `statCalculator`): HP por `calculateMaxHP` e os demais derivados de base stats, nível, EVs, IVs e Natureza em `calculateStat`. Nenhuma fórmula é duplicada.
- O PP inicial vem do campo `pp` da PokeAPI, com usos cheios; golpes importados nunca começam com 0 PP.
- `instanceId` é gerado pela normalização existente (`normalizeTeamInstanceIds`), inclusive para espécies repetidas.
- A importação precisa da PokeAPI (ou do cache local) para validar espécies, golpes e habilidades.

Erros de validação exibidos em português, sem travar a configuração nem importar nada: quantidade diferente do modo (`TEAM_SIZE_MISMATCH`), espécie ou golpe inexistente, habilidade/item desconhecidos, nível fora de 1–100, IV fora de 0–31, EV fora de 0–255, soma de EVs acima de 510, mais de 4 golpes, nenhum golpe, Natureza/Tera Type inválidos, linha não reconhecida e texto vazio.

A exportação para texto Showdown usa os botões **📤 Exportar (Showdown)** no painel de importação e **📤 Exportar Time (Showdown)** no Construtor. A espécie vem de `speciesId` e o apelido de `name`; IVs só aparecem quando diferentes de 31 e EVs só quando diferentes de 0. A **exportação JSON continua inalterada** e independente deste formato.

## Segurança e configuração do servidor

Por padrão, o servidor escuta apenas em `127.0.0.1`. O endpoint `/api/llm-action` aceita exclusivamente chamadas originadas do loopback, mesmo quando `LLM_PROXY_HOST` expõe a aplicação na rede. O endereço é obtido do socket e cabeçalhos como `X-Forwarded-For` são ignorados, pois podem ser falsificados. Não há autenticação remota nesta versão: chamadas remotas ao proxy de LLM permanecem bloqueadas.

As rotas de LLM e de catálogo têm limite de 60 requisições por minuto por cliente, configurável. Ao exceder o limite, a resposta é `429` com o cabeçalho `Retry-After`. As chamadas externas usam timeout de 30 segundos, o catálogo dinâmico usa 5 segundos e o SDK do Gemini recebe `httpOptions.timeout` e `abortSignal`, cancelando a requisição real.

Os modelos gratuitos atuais e todos os fallbacks continuam permitidos. A allowlist padrão de modelos pagos contém apenas `gemini-2.5-pro`, `openrouter:deepseek/deepseek-chat` e `deepseek:deepseek-chat`. Qualquer outro modelo pago precisa ser incluído explicitamente em `LLM_ALLOWED_PAID_MODELS`, no formato `provider:model`, separado por vírgulas. A mesma política vale para a escolha do cliente, para o catálogo e para os fallbacks do servidor.

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `GEMINI_API_KEY` ou `GOOGLE_API_KEY` | vazio | Chave do Google Gemini. |
| `OPENROUTER_API_KEY` | vazio | Chave da OpenRouter. |
| `DEEPSEEK_API_KEY` | vazio | Chave da DeepSeek. |
| `LLM_PROXY_HOST` | `127.0.0.1` | Interface de escuta. Defina explicitamente (por exemplo, `0.0.0.0`) para expor a aplicação; o proxy de LLM continua local. |
| `LLM_RATE_LIMIT_MAX` | `60` | Máximo de requisições por janela nos endpoints de LLM e modelos. |
| `LLM_RATE_LIMIT_WINDOW_MS` | `60000` | Tamanho da janela do rate limit em milissegundos. |
| `LLM_REQUEST_TIMEOUT_MS` | `30000` | Timeout das chamadas aos provedores de LLM. |
| `LLM_ALLOWED_PAID_MODELS` | vazio | Modelos pagos adicionais, no formato `provider:model`, separados por vírgulas. |

Mantenha as chaves somente em `.env.local`, que é ignorado pelo Git. Nunca grave valores reais em `.env.example` ou na documentação.
