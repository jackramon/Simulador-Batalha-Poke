import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { loadLocalEnv } from './server/env';
import { readServerConfig } from './server/config';
import {
  createLlmModelPolicy,
  isOpenRouterModelFree,
  type LlmProvider,
} from './server/modelPolicy';
import {
  CATALOG_TIMEOUT_MS,
  createGeminiGenerateConfig,
  createTimeoutController,
  fetchWithTimeout,
  OutboundTimeoutError,
} from './server/outbound';
import { createRateLimit, requireLoopback } from './server/security';

const STATIC_OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-flash:free', name: 'Google: Gemini 2.5 Flash (free)', isFree: true },
  {
    id: 'meta-llama/llama-3-8b-instruct:free',
    name: 'Meta: Llama 3 8B Instruct (free)',
    isFree: true,
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral: Mistral 7B Instruct (free)',
    isFree: true,
  },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek: V3 (paid)', isFree: false },
];

async function startServer() {
  loadLocalEnv();
  const app = express();
  const config = readServerConfig();
  const { host: HOST, port: PORT } = config;
  const modelPolicy = createLlmModelPolicy(config.paidModelAllowlist);
  const llmRateLimit = createRateLimit(config.rateLimit);

  const formatOpenRouterModels = (models: any[]) => {
    const formatted = models.map((model: any) => ({
      id: model.id,
      name: model.name,
      isFree: isOpenRouterModelFree(model),
    }));

    modelPolicy.registerOpenRouterFreeModels(
      formatted.filter((model) => model.isFree).map((model) => model.id),
    );

    return formatted.filter(
      (model) => model.isFree || modelPolicy.isAllowed('openrouter', model.id),
    );
  };

  const fetchOpenRouterCatalog = async (): Promise<any[]> => {
    const response = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/models',
      {},
      CATALOG_TIMEOUT_MS,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch models from OpenRouter');
    }

    const data: any = await response.json();
    return data.data || [];
  };

  const resolveModel = (
    provider: LlmProvider,
    requested: unknown,
    fallback: string,
  ): string | null => {
    if (requested !== undefined && requested !== null && typeof requested !== 'string') {
      return null;
    }

    const candidate =
      typeof requested === 'string' && requested.trim() ? requested.trim() : fallback;
    return modelPolicy.isAllowed(provider, candidate) ? candidate : null;
  };

  const rejectModel = (res: any, provider: LlmProvider) =>
    res.status(400).json({
      error: `Modelo de ${provider} não permitido. Use um modelo gratuito ou adicione-o explicitamente a LLM_ALLOWED_PAID_MODELS.`,
    });

  app.use(express.json());

  // API routes FIRST
  app.get('/api/openrouter-models', llmRateLimit, async (req, res) => {
    try {
      const models = await fetchOpenRouterCatalog();
      res.json({ models: formatOpenRouterModels(models) });
    } catch (error: any) {
      console.error('Error fetching OpenRouter models:', error);
      // Return a basic stable static list on failure
      res.json({
        models: STATIC_OPENROUTER_MODELS.filter(
          (model) => model.isFree || modelPolicy.isAllowed('openrouter', model.id),
        ),
      });
    }
  });

  // Helper function to call Google Gemini
  const callGeminiFallback = async (
    promptText: string,
    modelName: string,
    apiKeyVal: string,
    expressRes: any,
  ) => {
    const effectiveModel = modelName || 'gemini-2.5-flash';
    if (!modelPolicy.isAllowed('gemini', effectiveModel)) {
      return rejectModel(expressRes, 'gemini');
    }

    const geminiTimeout = createTimeoutController(config.requestTimeoutMs);
    try {
      console.log(`Cascading to native Gemini fallback with model: ${effectiveModel}`);
      const ai = new GoogleGenAI({ apiKey: apiKeyVal });
      const response = await ai.models.generateContent({
        model: effectiveModel,
        contents: promptText,
        config: createGeminiGenerateConfig(config.requestTimeoutMs, geminiTimeout.signal),
      });
      return expressRes.json({ result: response.text });
    } catch (fallbackError: any) {
      if (geminiTimeout.didTimeout()) {
        console.error('Gemini fallback timed out.');
        return expressRes.status(504).json({
          error: 'O provedor Gemini excedeu o tempo limite. Tente novamente.',
        });
      }
      console.error('Gemini fallback failed:', fallbackError);
      let errMsg = fallbackError.message || String(fallbackError);
      if (
        errMsg.includes('API key not valid') ||
        errMsg.includes('API_KEY_INVALID') ||
        errMsg.includes('INVALID_ARGUMENT') ||
        errMsg.includes('key not valid')
      ) {
        errMsg =
          'A chave de API do Gemini (GEMINI_API_KEY / GOOGLE_API_KEY) está inválida ou expirou. Por favor, configure uma chave de API válida na aba Settings (Configurações) no menu superior do AI Studio para habilitar a IA Real.';
      }
      return expressRes.status(500).json({ error: errMsg });
    } finally {
      geminiTimeout.clear();
    }
  };

  app.post('/api/llm-action', requireLoopback, llmRateLimit, async (req, res) => {
    try {
      const { prompt, provider, model } = req.body ?? {};
      const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

      if (provider === 'openrouter') {
        const targetModel = resolveModel('openrouter', model, 'google/gemini-2.5-flash:free');
        if (!targetModel) {
          return rejectModel(res, 'openrouter');
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
          if (geminiApiKey) {
            console.log('OPENROUTER_API_KEY is not set. Falling back to native Gemini...');
            return callGeminiFallback(prompt, 'gemini-2.5-flash', geminiApiKey, res);
          }
          return res
            .status(400)
            .json({ error: 'OPENROUTER_API_KEY não configurada nas Configurações (Settings).' });
        }

        try {
          let openRouterResponse: any = null;
          let lastErrorMsg = '';
          let lastError: unknown = null;
          let attempts = 0;
          let currentModel = targetModel;

          // List of fallback models to try if the initial choice fails
          const fallbackCandidates = modelPolicy.filterAllowed('openrouter', [
            'google/gemma-2-9b-it:free',
            'mistralai/mistral-7b-instruct:free',
            'qwen/qwen-2-7b-instruct:free',
            'microsoft/phi-3-medium-128k-instruct:free',
          ]);

          // Try to dynamically pre-fetch actually free models from OpenRouter's live catalog
          try {
            const availableModels = formatOpenRouterModels(await fetchOpenRouterCatalog());
            const freeIds = availableModels
              .filter((model) => model.isFree)
              .map((model) => model.id);
            for (const id of freeIds) {
              if (!fallbackCandidates.includes(id)) {
                fallbackCandidates.unshift(id); // try dynamic free ones first!
              }
            }
          } catch (e) {
            console.error('Failed to pre-fetch free candidates dynamically:', e);
          }

          // Ensure our initial targetModel isn't duplicated in the fallback list
          const idx = fallbackCandidates.indexOf(currentModel);
          if (idx > -1) {
            fallbackCandidates.splice(idx, 1);
          }

          while (attempts < 4) {
            lastError = null;
            console.log(
              `Sending OpenRouter request using model: ${currentModel} (Attempt ${attempts + 1})`,
            );
            try {
              openRouterResponse = await fetchWithTimeout(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://ai.studio/build',
                    'X-Title': 'Pokemon Battle Simulator',
                  },
                  body: JSON.stringify({
                    model: currentModel,
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: 'json_object' },
                    temperature: 0.2,
                  }),
                },
                config.requestTimeoutMs,
              );

              if (openRouterResponse.ok) {
                break; // Success!
              }

              const errData = await openRouterResponse
                .clone()
                .json()
                .catch(() => ({}));
              lastErrorMsg = errData.error?.message || `Status ${openRouterResponse.status}`;
              console.warn(`OpenRouter model ${currentModel} failed: ${lastErrorMsg}`);
            } catch (err: any) {
              lastError = err;
              lastErrorMsg = err.message || String(err);
              console.error(`Fetch error for model ${currentModel}:`, err);
            }

            if (fallbackCandidates.length > 0) {
              currentModel = fallbackCandidates.shift()!;
              attempts++;
            } else {
              break; // No more models to try
            }
          }

          if (!openRouterResponse || !openRouterResponse.ok) {
            if (lastError instanceof OutboundTimeoutError) {
              throw lastError;
            }
            throw new Error(`OpenRouter API error after multiple fallbacks: ${lastErrorMsg}`);
          }

          const data: any = await openRouterResponse.json();
          const textResponse = data.choices?.[0]?.message?.content || '';
          return res.json({ result: textResponse });
        } catch (openRouterErr: any) {
          console.error('OpenRouter request failed, attempting Gemini cascade:', openRouterErr);
          if (geminiApiKey) {
            return callGeminiFallback(prompt, 'gemini-2.5-flash', geminiApiKey, res);
          }
          throw openRouterErr;
        }
      }

      if (provider === 'deepseek') {
        const targetModel = resolveModel('deepseek', model, 'deepseek-chat');
        if (!targetModel) {
          return rejectModel(res, 'deepseek');
        }

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
          if (geminiApiKey) {
            console.log('DEEPSEEK_API_KEY is not set. Falling back to native Gemini...');
            return callGeminiFallback(prompt, 'gemini-2.5-flash', geminiApiKey, res);
          }
          return res
            .status(400)
            .json({ error: 'DEEPSEEK_API_KEY não configurada nas Configurações (Settings).' });
        }

        try {
          const deepseekResponse = await fetchWithTimeout(
            'https://api.deepseek.com/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: targetModel,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.2,
              }),
            },
            config.requestTimeoutMs,
          );

          if (!deepseekResponse.ok) {
            const errData = await deepseekResponse.json().catch(() => ({}));
            throw new Error(`DeepSeek API error: ${JSON.stringify(errData)}`);
          }

          const data: any = await deepseekResponse.json();
          const textResponse = data.choices?.[0]?.message?.content || '';
          return res.json({ result: textResponse });
        } catch (deepseekErr: any) {
          console.error('DeepSeek request failed, attempting Gemini cascade:', deepseekErr);
          if (geminiApiKey) {
            return callGeminiFallback(prompt, 'gemini-2.5-flash', geminiApiKey, res);
          }
          throw deepseekErr;
        }
      }

      // Default: Google Gemini
      const targetModel = resolveModel('gemini', model, 'gemini-2.5-flash');
      if (!targetModel) {
        return rejectModel(res, 'gemini');
      }
      if (!geminiApiKey) {
        return res
          .status(500)
          .json({ error: 'GEMINI_API_KEY ou GOOGLE_API_KEY não está configurada.' });
      }

      return callGeminiFallback(prompt, targetModel, geminiApiKey, res);
    } catch (error: any) {
      console.error('Error generating LLM action:', error);
      if (error instanceof OutboundTimeoutError) {
        return res.status(504).json({
          error: 'O provedor de IA excedeu o tempo limite. Tente novamente.',
        });
      }
      res.status(500).json({ error: error.message || 'Failed to generate LLM action' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // O curinga nomeado é compatível com o Express 5 e inclui a rota raiz.
    app.get('/{*splat}', (req, res, next) => {
      // APIs desconhecidas continuam com o 404 padrão em vez de receber a SPA.
      if (req.path === '/api' || req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
