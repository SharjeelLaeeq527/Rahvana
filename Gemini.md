# Gemini.md - Project Summary (Arachnie WhatsApp AI Assistant)

### Goal

Build an AI assistant that answers user questions using only pre-approved WhatsApp group knowledge, with strict rules:

- Never reveal personal details or who sent any message
- Use only factual, time-based, or situation-based information
- Every answer must start with: "Yes, according to the latest updates shared in the group,"

### Current Phase (Phase 1 – Static Data)

- Supabase fully connected
- Table created: `whatsapp_knowledge` (id + metadata jsonb)
- Static data (≈7 MB) will be cleaned and inserted soon
- Cleaning rules: remove phone numbers, timestamps, "thanks", congratulations, etc.

### Backend (Python / FastAPI)

- Gemini API integrated via OpenAI-compatible endpoint (openai-agent-sdk)
- Model used: `gemini-1.5-flash` (or 2.0-flash when available)
- Agent created with exact instructions and rules
- Service file: `backend/app/services/whatsapp_assistant.py`
- API endpoint ready: `POST /api/v1/ask-whatsapp` (or similar)
- Dependencies added: `openai`, `python-dotenv`, `openai-agent-sdk`

### Frontend

- Next.js + Supabase client (`lib/supabaseClient.ts`)
- Will call the backend API to get answers

### Tech Stack (All free tier friendly)

- Frontend: Next.js
- Backend: FastAPI (Python)
- Database: Supabase (PostgreSQL + jsonb storage)
- AI: Google Gemini (via OpenAI compatibility layer)
- Agent framework: openai-agent-sdk

### Next Steps

1. Upload & clean the 7 MB static WhatsApp data
2. Insert cleaned entries into Supabase `whatsapp_knowledge` table
3. Add RAG (Retrieval-Augmented Generation) – fetch relevant rows before sending to Gemini
4. Phase 2: Live WhatsApp group integration (later)

Project is fully on track and everything built so far is free, fast, and production-ready.
