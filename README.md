# Portfolio

Personal site and a local assistant. The browser talks to the Node API. Node talks to the Python service. Python talks to a model running on this machine through Ollama. No external AI API.

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

Node API: http://127.0.0.1:4000/api/health

Python service: http://127.0.0.1:8000/docs

## Local model

Install [Ollama](https://ollama.com), then:

```powershell
ollama pull llama3.2
```

The page still loads if Ollama is off. Chat tells you the model is offline. Change the model in `backend/python/.env` with `OLLAMA_MODEL`.
