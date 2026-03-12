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

### 3. USCIS Forms Auto-Fill
- **Seamless Integration:** Users enter basic info through a beautiful Next.js UI.
- **Automated PDF Generation:** The backend opens the official USCIS form PDF and correctly populates all fields.
- **Ready to Submit:** Returns a completed PDF requiring zero manual typing.

### 4. Visa Bulletin & IV Schedule Checker
- **Real-Time Visa Bulletin:** Compares the user's Priority Date with the U.S. Department of State Final Action Date for F1-F4 and EB1-EB5 visa categories.
- **Smart Estimates:** Provides wait-time estimates and historical movement data (e.g., F3 Philippines).
- **Immigrant Visa Schedule:** Displays the latest interview scheduling dates across worldwide U.S. embassies.

---

## 🏗️ Folder Structure

```text
d:\arachnie_work\updated_work\
├── actions/              # Next.js Server Actions for secure data mutation
├── app/                  # Next.js 15 App Router (Pages, Layouts, API Routes)
│   ├── (auth)/           # Authentication routes (Login, Register, Phone Auth)
│   ├── (main)/           # Main application layouts and static core pages
│   ├── (tools)/          # Interactive immigration tools & utilities
│   │   ├── (courier-registration)/   # Register for passport/document courier delivery
│   │   ├── (visa)/                   # Comprehensive visa processing paths
│   │   ├── affidavit-support-calculator/ # Calculate financial eligibility for I-864
│   │   ├── book-appointment/         # Schedule embassy or medical appointments
│   │   ├── case-status/              # Track real-time USCIS or NVC case status
│   │   ├── custom-requirements/      # Generate personalized document checklists
│   │   ├── document-translation/     # AI-powered document translation service
│   │   ├── document-vault/           # Secure cloud storage for sensitive files
│   │   ├── guides/                   # Detailed interactive step-by-step guides
│   │   ├── interview-prep/           # Mock visa interview practice questions
│   │   ├── passport/                 # Smart AI generator for 2x2 passport photos
│   │   ├── pdf-processing/           # Auto-fill complex USCIS PDF forms automatically
│   │   ├── police-verification/      # Guidance for obtaining police clearance certificates
│   │   ├── progress-tree-demo/       # Visual timeline tracker for immigration journeys
│   │   ├── signature-image-processing/ # Digitize and cleanly extract signatures
│   │   ├── tools/                    # Main dashboard hub containing all utilities
│   │   ├── visa-case-strength-checker/ # Evaluate approval likelihood based on profiles
│   │   └── visa-eligibility/         # Quick quiz to determine U.S. visa qualification
│   ├── api/              # Backend Next.js Route Handlers
│   ├── components/       # Route-specific React components
│   └── globals.css       # Global Tailwind 4 stylesheet
├── backend/              # Python FastAPI server for heavy AI processing
│   ├── app/              # FastAPI core logic (services, endpoints)
│   ├── modnet/           # AI models for image processing & background removal
│   ├── pdfs/             # Template USCIS PDFs for auto-filling
│   ├── pyproject.toml    # Python dependencies managed by UV/Hatchling
│   └── scripts/          # Backend utility python scripts
├── components/           # Reusable generic React UI components (shadcn-ui)
├── data/                 # Static JSON contents, constants, and raw data maps
├── documentations/       # Project-specific documentation and references
├── lib/                  # Helper utilities (Supabase, Stripe, formatting tools)
├── public/               # Static assets (images, icons, favicons)
├── scripts/              # Useful Node.js automation and database utility scripts
├── supabase/             # Local database configurations, migrations, and edge functions
├── types/                # Global TypeScript definitions & interfaces
├── uploads/              # Temporary storage for user-uploaded files pending processing
├── package.json          # Node.js frontend dependencies and run scripts
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
