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
