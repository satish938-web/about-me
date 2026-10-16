# Portfolio

Personal site and a local assistant. The browser calls `/api` on the site. Next forwards that to the Python service. Python talks to Groq, or to Ollama on this machine. Node is a local shortcut and is not required for the live site.

## Folders

```
frontend/          Next.js site
backend/node/      Node API the browser calls
backend/python/    FastAPI service. Builds the prompt and calls Ollama
content/           Name, projects, and skills. The site and Python both read these files
```

Edit the JSON files in `content/` to change what the page and the assistant say.

## Run

```powershell
npm run setup:frontend
npm run setup:python
copy backend\python\.env.example backend\python\.env
npm run dev
```

Site: http://localhost:3000

Chat through the site: http://localhost:3000/api/health

Python service: http://127.0.0.1:8000/docs

## Live site

Frontend on Vercel, root directory `frontend`, and turn on files outside that directory so `content/` is included. Set `PYTHON_SERVICE_URL` to the Python service URL.

Python on Render from this repo root, using `render.yaml`. Set `GROQ_API_KEY` there. `https://*.vercel.app` is already allowed to call it. Add any custom domain in `CORS_ORIGINS`.

## Local model

Install [Ollama](https://ollama.com), then:

```powershell
ollama pull llama3.2
```

The page still loads if Ollama is off. Chat tells you the model is offline. Change the model in `backend/python/.env` with `OLLAMA_MODEL`.
