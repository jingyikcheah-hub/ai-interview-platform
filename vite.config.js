import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { GoogleGenerativeAI } from '@google/generative-ai'

function apiPlugin(env) {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/gemini' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const { prompt } = JSON.parse(body);
              const apiKey = env.GEMINI_API_KEY;
              if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'API key configuration error' }));
                return;
              }
              const genAI = new GoogleGenerativeAI(apiKey);
              const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
              let result;
              let retries = 3;
              while (retries > 0) {
                try {
                  result = await model.generateContent(prompt);
                  break;
                } catch (err) {
                  retries--;
                  if (retries === 0) throw err;
                  await new Promise(r => setTimeout(r, 2000));
                }
              }
              const text = result.response.text();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), apiPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})