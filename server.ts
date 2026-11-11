import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get('/api/openrouter-models', async (req, res) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch('https://openrouter.ai/api/v1/models', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to fetch models from OpenRouter');
      }
      
      const data: any = await response.json();
      const models = data.data || [];
      const formatted = models
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          isFree: m.id.endsWith(':free') || (m.pricing && parseFloat(m.pricing.prompt) === 0)
        }))
        // Filter free models or very cheap popular models
        .filter((m: any) => m.isFree || m.id.includes('deepseek') || m.id.includes('llama-3') || m.id.includes('qwen-2.5'));
        
      res.json({ models: formatted });
    } catch (error: any) {
      console.error('Error fetching OpenRouter models:', error);
      // Return a basic stable static list on failure
      res.json({
        models: [
          { id: 'google/gemini-2.5-flash:free', name: 'Google: Gemini 2.5 Flash (free)', isFree: true },
          { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Meta: Llama 3 8B Instruct (free)', isFree: true },
          { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral: Mistral 7B Instruct (free)', isFree: true },
          { id: 'deepseek/deepseek-chat', name: 'DeepSeek: V3 (paid)', isFree: false }
        ]
      });
    }
  });

  // Helper function to call Google Gemini
  const callGeminiFallback = async (promptText: string, modelName: string, apiKeyVal: string, expressRes: any) => {
    try {
      console.log(`Cascading to native Gemini fallback with model: ${modelName}`);
      const ai = new GoogleGenAI({ apiKey: apiKeyVal });
      const response = await ai.models.generateContent({
        model: modelName || 'gemini-2.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        }
      });
      return expressRes.json({ result: response.text });
    } catch (fallbackError: any) {
      console.error('Gemini fallback failed:', fallbackError);
      let errMsg = fallbackError.message || String(fallbackError);
      if (
        errMsg.includes('API key not valid') || 
        errMsg.includes('API_KEY_INVALID') || 
        errMsg.includes('INVALID_ARGUMENT') || 
        errMsg.includes('key not valid')
      ) {
        errMsg = "A chave de API do Gemini (GEMINI_API_KEY / GOOGLE_API_KEY) está inválida ou expirou. Por favor, configure uma chave de API válida na aba Settings (Configurações) no menu superior do AI Studio para habilitar a IA Real.";
      }
      return expressRes.status(500).json({ error: errMsg });
    }
  };

  app.post('/api/llm-action', async (req, res) => {
    try {
      const { prompt, provider, model } = req.body;
      const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      
      if (provider === 'openrouter') {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
          if (geminiApiKey) {
            console.log('OPENROUTER_API_KEY is not set. Falling back to native Gemini...');
            return callGeminiFallback(prompt, 'gemini-2.5-flash', geminiApiKey, res);
          }
          return res.status(400).json({ error: 'OPENROUTER_API_KEY não configurada nas Configurações (Settings).' });
        }

        let targetModel = model || 'google/gemini-2.5-flash:free';
        
        try {
          let openRouterResponse: any = null;
          let lastErrorMsg = '';
          let attempts = 0;
          
          // List of fallback models to try if the initial choice fails
          const fallbackCandidates = [
            'google/gemma-2-9b-it:free',
            'mistralai/mistral-7b-instruct:free',
            'qwen/qwen-2-7b-instruct:free',
            'microsoft/phi-3-medium-128k-instruct:free'
          ];

          // Try to dynamically pre-fetch actually free models from OpenRouter's live catalog
          try {
            const modelsRes = await fetch('https://openrouter.ai/api/v1/models');
            if (modelsRes.ok) {
              const modelsData: any = await modelsRes.json();
              const freeIds = (modelsData.data || [])
                .filter((m: any) => m.id.endsWith(':free') || (m.pricing && parseFloat(m.pricing.prompt) === 0))
                .map((m: any) => m.id);
              for (const id of freeIds) {
                if (!fallbackCandidates.includes(id)) {
                  fallbackCandidates.unshift(id); // try dynamic free ones first!
                }
              }
            }
          } catch (e) {
            console.error('Failed to pre-fetch free candidates dynamically:', e);
          }

          // Ensure our initial targetModel isn't duplicated in the fallback list
          const idx = fallbackCandidates.indexOf(targetModel);
          if (idx > -1) {
            fallbackCandidates.splice(idx, 1);
          }

          while (attempts < 4) {
            console.log(`Sending OpenRouter request using model: ${targetModel} (Attempt ${attempts + 1})`);
            try {
              openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
                  'HTTP-Referer': 'https://ai.studio/build',
                  'X-Title': 'Pokemon Battle Simulator'
                },
                body: JSON.stringify({
                  model: targetModel,
                  messages: [{ role: 'user', content: prompt }],
                  response_format: { type: 'json_object' },
                  temperature: 0.2
                })
              });

              if (openRouterResponse.ok) {
                break; // Success!
              } else {
                const errData = await openRouterResponse.clone().json().catch(() => ({}));
                lastErrorMsg = errData.error?.message || `Status ${openRouterResponse.status}`;
                console.warn(`OpenRouter model ${targetModel} failed: ${lastErrorMsg}`);
                
                if (fallbackCandidates.length > 0) {
                  targetModel = fallbackCandidates.shift()!;
                  attempts++;
                } else {
                  break; // No more models to try
                }
              }
            } catch (err: any) {
              lastErrorMsg = err.message || String(err);
              console.error(`Fetch error for model ${targetModel}:`, err);
              if (fallbackCandidates.length > 0) {
                targetModel = fallbackCandidates.shift()!;
                attempts++;
              } else {
                break;
              }
            }
          }

          if (!openRouterResponse || !openRouterResponse.ok) {
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
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
          if (geminiApiKey) {
            console.log('DEEPSEEK_API_KEY is not set. Falling back to native Gemini...');
            return callGeminiFallback(prompt, 'gemini-2.5-flash', geminiApiKey, res);
          }
          return res.status(400).json({ error: 'DEEPSEEK_API_KEY não configurada nas Configurações (Settings).' });
        }

        try {
          const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model || 'deepseek-chat',
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_object' },
              temperature: 0.2
            })
          });

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
      if (!geminiApiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY ou GOOGLE_API_KEY não está configurada.' });
      }

      return callGeminiFallback(prompt, model || 'gemini-2.5-flash', geminiApiKey, res);
    } catch (error: any) {
      console.error('Error generating LLM action:', error);
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
