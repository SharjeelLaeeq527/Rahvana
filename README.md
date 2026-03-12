# Rahvana & Arachnie AI – Immigration Assistant

Welcome to the **Rahvana** project repository. This project is a comprehensive immigration assistance platform that simplifies visa processes, form filling, and provides AI-driven query resolution. 

This repository contains both the **Next.js Frontend** and the **FastAPI Backend**, integrated with **Supabase** for database management and **Gemini AI** for intelligent interactions.

## 🌟 Key Features

### 1. Arachnie WhatsApp AI Assistant (Phase 1)
- **AI-Powered Q&A:** Answers user questions based *only* on pre-approved WhatsApp group knowledge.
- **Privacy-First:** Strict rules to never reveal personal details or message senders.
- **RAG Implementation:** Uses Supabase `whatsapp_knowledge` table to retrieve relevant ground-truth data before querying Gemini.
- **Framework:** Powered by Google Gemini (`gemini-1.5-flash`) via the `openai-agent-sdk`.

### 2. Smart Passport Photo Generator
- **Auto Background Removal:** Removes background from selfies in seconds.
- **Compliance Cropping:** Detects faces and crops them to meet official U.S. passport photo rules (2x2 inches, 600x600 px).
- **Enhancement:** Automatically improves lighting and smoothness.

### 3. USCIS I-130 Form Auto-Fill
- **Seamless Integration:** Users enter basic info through a beautiful Next.js UI.
- **Automated PDF Generation:** The backend opens the official USCIS I-130 PDF and correctly populates all fields.
- **Ready to Submit:** Returns a completed PDF requiring zero manual typing.

### 4. Visa Bulletin & IV Schedule Checker
- **Real-Time Visa Bulletin:** Compares the user's Priority Date with the U.S. Department of State Final Action Date for F1-F4 and EB1-EB5 visa categories.
- **Smart Estimates:** Provides wait-time estimates and historical movement data (e.g., F3 Philippines).
- **Immigrant Visa Schedule:** Displays the latest interview scheduling dates across worldwide U.S. embassies.

---

## 🏗️ Folder Structure

```text
d:\arachnie_work\updated_work\
├── app/                  # Next.js 15 Frontend Application 
│   ├── (auth)/           # Authentication routes (Login, Register)
│   ├── (main)/           # Main app layout and core pages
│   ├── (tools)/          # UI for tools (Visa checker, Passport Maker, etc.)
│   ├── api/              # Next.js API Routes
│   ├── components/       # Reusable React components
│   └── globals.css       # Tailwind 4 global styles
├── backend/              # Python FastAPI Server
│   ├── app/              # FastAPI application core
│   │   ├── services/     # Business logic (whatsapp_assistant.py, photo processing, PDF filling)
│   │   └── main.py       # FastAPI entry point
│   ├── modnet/           # AI models for image processing
│   ├── pdfs/             # Template USCIS PDFs
│   ├── pyproject.toml    # Python dependencies (uv/hatchling)
│   └── scripts/          # Backend utility scripts
├── components/           # Main React shared components directory
├── lib/                  # Utilities (Supabase client, Stripe, helpers)
├── public/               # Static assets (images, icons, favicons)
├── supabase/             # Supabase migrations and configurations
├── package.json          # Frontend dependencies
└── Gemini.md             # Specific project rules & phases for the AI Assistant
```

---

## 💻 Tech Stack

- **Frontend:** Next.js 15, React 19, TailwindCSS 4, Framer Motion, Zustand
- **Backend:** Python 3.10+, FastAPI, Uvicorn, Rembg, OpenCV
- **Database & Auth:** Supabase (PostgreSQL with `jsonb` support)
- **AI / LLMs:** Google Gemini (via `openai-agent-sdk`), Qdrant (Vector DB)
- **Payments:** Stripe integration

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- [Supabase Account](https://supabase.com/)
- [Stripe Account](https://stripe.com/)

### 1. Clone & Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
# Recommended: Create a virtual environment using `uv` or `venv`
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
```

### 2. Environment Variables

Create `.env.local` for the frontend in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_PRICE_ID_PLUS=your_actual_plus_price_id
STRIPE_PRICE_ID_PRO=your_actual_pro_price_id
# Add other required keys
```

Create `.env` inside the `backend/` directory:
```env
# Gemini / OpenAI compatible keys for openai-agent-sdk
OPENAI_API_KEY=your_gemini_api_key 
# Database connection for RAG
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
```

### 3. Running the App Local

**Run the Next.js Frontend (Root directory):**
```bash
npm run dev
# App will be available at http://localhost:3000
```

**Run the FastAPI Backend (`/backend` directory):**
```bash
fastapi dev app/main.py
# API running at http://localhost:8000
# Swagger UI available at http://localhost:8000/docs
```

---

## 📝 Developer Notes & Best Practices

- **Adding Features:** Place new React components in `components/` and define Next.js routing within `app/`. For heavy processing or AI tasks, build a new service in `backend/app/services/` and expose it via FastAPI.
- **Supabase Integration:** The frontend uses `@supabase/ssr` for auth and light data fetching. The backend interacts with Supabase using the official Python client for heavy vector/RAG queries.
- **Stripe Testing:** Review `STRIPE_TESTING.md` and `STRIPE_PRICE_SETUP.md` to configure correct testing price IDs.

*(This documentation is continuously updated as new features are rolled out.)*
