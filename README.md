# 🌍 Rahvana Immigration Assistant

> **A comprehensive, AI-powered immigration assistance platform** that simplifies visa processes, automates form filling, provides intelligent guidance, and empowers users to reunite with their loved ones.

**Rahvana** is a full-stack web application combining a **Next.js 15 frontend**, **Python FastAPI backend**, **Supabase database**, and **Google Gemini AI** to deliver powerful immigration tools, real-time visa tracking, document processing, interview preparation, and much more.

---

## 📋 Table of Contents

- [🌟 Key Features](#-key-features)
- [📊 Architecture Overview](#-architecture-overview)
- [💻 Tech Stack](#-tech-stack)
- [🏗️ Project Structure](#-project-structure)
- [⚡ Core Modules](#-core-modules)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Development Setup](#-development-setup)
- [📡 API Documentation](#-api-documentation)
- [🔐 Authentication & Security](#-authentication--security)
- [📦 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Key Features

### 🔤 1. **WhatsApp AI Assistant (Future)**
An intelligent, privacy-first AI assistant powered by Google Gemini and Retrieval-Augmented Generation (RAG):
- **Knowledge Base:** Answers questions using only pre-approved WhatsApp group knowledge stored in Supabase
- **Privacy Guaranteed:** Strict rules ensure personal details and message senders are never revealed
- **RAG Pipeline:** Intelligent retrieval of ground-truth data before querying Gemini for accurate responses
- **Real-time Updates:** Dynamically updated knowledge base for current immigration trends and procedures
- **Framework:** Built with `openai-agent-sdk` and `gemini-1.5-flash` (or 2.0-flash)

### 📸 2. **Smart Passport Photo Generator**
Professional passport photos generated and validated in seconds:
- **Auto Background Removal:** AI-powered background removal for clean, professional photos
- **US Compliance Cropping:** Automatic face detection and cropping to official U.S. passport standards (2x2 inches, 600x600 px)
- **Image Enhancement:** Automatic lighting correction and quality improvement using OpenCV & Rembg
- **Batch Processing:** Support for multiple photo processing with consistent formatting

### 📝 3. **USCIS Forms Auto-Fill Engine**
Eliminate manual form filling with intelligent PDF automation:
- **Smart Form Recognition:** Automatically identifies and parses USCIS forms
- **Intelligent Populating:** Uses user-provided data to correctly fill all form fields
- **Multi-Form Support:** Handles complex forms like I-485, I-765, I-131, and more
- **PDF Generation:** Returns production-ready PDFs ready for official submission
- **Error Validation:** Pre-submission validation to catch missing or incorrectly formatted data

### 📅 4. **Visa Bulletin & IV Schedule Checker**
Real-time visa processing tracking and timeline estimations:
- **Live Visa Bulletin:** Tracks the latest U.S. Department of State visa bulletin data
- **Priority Date Analysis:** Compares user's priority date against Final Action Dates for F1-F4 and EB1-EB5 categories
- **Wait Time Estimation:** Provides historical analysis and intelligent wait-time predictions
- **Immigrant Visa Schedule:** Displays latest interview scheduling across all U.S. embassies worldwide
- **Multi-Category Support:** Tracks employment-based, family-based, and diversity visas

### 🗂️ 5. **Document Translation Module**
AI-powered document translation with OCR support:
- **Multi-Language Support:** Translate documents to/from multiple languages
- **OCR Integration:** Automatic text extraction from scanned documents and images
- **Format Preservation:** Maintains original document layout and formatting
- **User Association:** All translations are securely linked to user accounts via Row-Level Security

### 🎯 6. **Interview Preparation Suite**
Comprehensive mock interview training and guidance:
- **Question Bank:** 1000+ real visa interview questions organized by category
- **AI Feedback:** Instant feedback on responses using Gemini AI
- **Video Recording:** Practice and record mock interviews for self-review
- **Topic-Specific Training:** Preparation guides for F1, H1-B, EB, and family visas
- **Performance Tracking:** Progress monitoring and improvement recommendations

### 💪 7. **Visa Case Strength Evaluator**
Predict approval likelihood using AI analysis:
- **Profile Analysis:** Comprehensive evaluation of visa profile and supporting documents
- **Risk Assessment:** Identifies potential red flags and areas of concern
- **Recommendation Engine:** Suggests document improvements and strengthening strategies
- **Historical Benchmarking:** Compare profile against historical approval rates

### 📦 8. **Document Vault**
Secure cloud storage for sensitive immigration documents:
- **Encryption:** End-to-end encryption for all stored documents
- **Access Control:** Fine-grained permissions and sharing capabilities
- **Version History:** Track document revisions and amendments
- **Supabase Integration:** Row-Level Security ensures user data isolation

### 🎨 9. **Additional Tools Suite**
- **Affidavit Support Calculator:** Financial eligibility calculations for I-864 forms
- **Appointment Booking:** Schedule embassy and medical appointments
- **Case Status Tracker:** Real-time USCIS and NVC case tracking
- **Custom Requirements Generator:** Personalized document checklists by visa category
- **Police Verification Guide:** Step-by-step guidance for police clearance certificates
- **Signature Processing:** Digitize and extract signatures for legible forms
- **Progress Timeline:** Visual journey tracker for immigration milestones

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Next.js)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React 19 Components | TailwindCSS 4 | Framer Motion │   │
│  │  Authentication (Supabase) | State (Zustand)         │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────┬────────────────────────────────────────────┘
                │ TypeScript (Type-Safe)
                │ TanStack Query | Axios | Fetch
┌───────────────▼────────────────────────────────────────────┐
│                   API GATEWAY LAYER                        │
│  Next.js API Routes + FastAPI Backend Routes              │
│  CORS Middleware | Authentication | Request Validation    │
└───────────────┬────────────────────────────────────────────┘
                │
     ┌──────────┴──────────┬──────────────┐
     │                     │              │
┌────▼─────┐  ┌───────────▼──┐  ┌──────▼──────┐
│  FastAPI │  │   Supabase   │  │   External  │
│ (Python) │  │ (PostgreSQL) │  │   Services  │
└────┬─────┘  └──────┬───────┘  └─────┬───────┘
     │               │                │
┌────▼─────────────────────────────────▼────────┐
│         DATA & SERVICES LAYER                │
│  • Image Processing (Rembg, OpenCV)         │
│  • PDF Processing (pypdf, reportlab)        │
│  • AI Agents (Gemini via openai-agent-sdk)  │
│  • Vector DB (Qdrant for RAG)               │
│  • Translation (argostranslate)             │
│  • Encryption (pycryptodome)                │
└─────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

### **Frontend**
- **Framework:** Next.js 15 (App Router, Server Components)
- **UI Library:** React 19 with Hooks & Context API
- **Styling:** TailwindCSS 4 with custom extensions
- **Animation:** Framer Motion, GSAP
- **State Management:** Zustand (lightweight, scalable)
- **Form Handling:** React Hook Form + Zod validation
- **HTTP Client:** Axios, SWR, Fetch API
- **UI Components:** shadcn-ui (Radix UI primitives)
- **PDF Viewer:** @react-pdf-viewer
- **Image Processing:** html2canvas, react-easy-crop, sharp
- **Internationalization:** next-intl

### **Backend**
- **Runtime:** Python 3.10+ (Optimized for performance)
- **Framework:** FastAPI (Async-first, high performance)
- **ASGI Server:** Uvicorn with WebSocket support
- **Image Processing:** Rembg, OpenCV, Pillow, PIL
- **PDF Handling:** pypdf, reportlab, pdfplumber, PyMuPDF
- **AI/ML:** 
  - Google Gemini API (via openai-agent-sdk)
  - Sentence Transformers (embeddings)
  - Qdrant Client (vector search)
- **Data Processing:** Pandas, NumPy
- **OCR:** Tesseract.js, pdf2image
- **Translation:** argostranslate, translatepy
- **Encryption:** pycryptodome
- **HTTP:** httpx for async requests

### **Database & Authentication**
- **Primary DB:** Supabase (PostgreSQL 15+)
- **Authentication:** Supabase Auth (JWT-based)
- **Authorization:** Row-Level Security (RLS) policies
- **File Storage:** Supabase Storage (Cloud storage)
- **Real-time:** PostgreSQL LISTEN/NOTIFY
- **Vector Embeddings:** Qdrant (Rust-based vector DB)

### **AI & LLMs**
- **Large Language Model:** Google Gemini (gemini-1.5-flash, gemini-2.0-flash)
- **Agent Framework:** openai-agent-sdk (OpenAI-compatible interface)
- **Embeddings:** sentence-transformers (huggingface models)
- **RAG Pipeline:** Supabase + Qdrant

### **Infrastructure & Deployment**
- **Frontend Hosting:** Vercel (optimized for Next.js)
- **Backend Hosting:** Render.com, Railway, or custom servers
- **Environment:** Docker containerization ready
- **CI/CD:** GitHub Actions integration
- **Payments:** Stripe (subscription handling)
- **Email:** Resend (transactional emails)

---

## 🏗️ Project Structure

```
Rahvana/
│
├── app/                              # Next.js 15 App Router (Main Application)
│   ├── globals.css                   # Global TailwindCSS styling
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Home page
│   │
│   ├── (auth)/                       # Authentication layout group
│   │   ├── login/                    # User login flow
│   │   ├── register/                 # User registration
│   │   └── phone-auth/               # Phone-based authentication
│   │
│   ├── (main)/                       # Main application layout group
│   │   ├── dashboard/                # User dashboard
│   │   └── profile/                  # User profile management
│   │
│   ├── (tools)/                      # Immigration tools layout group
│   │   ├── (courier-registration)/   # Courier service registration
│   │   ├── (visa)/                   # Visa-related tools
│   │   ├── affidavit-support-calculator/  # I-864 calculator
│   │   ├── book-appointment/         # Embassy appointment booking
│   │   ├── case-status/              # USCIS/NVC case tracking
│   │   ├── custom-requirements/      # Document checklists
│   │   ├── document-translation/     # Document translation
│   │   ├── document-vault/           # Secure file storage
│   │   ├── guides/                   # Immigration guides
│   │   ├── interview-prep/           # Mock interviews
│   │   ├── passport/                 # Passport photo generator
│   │   ├── pdf-processing/           # PDF form auto-fill
│   │   ├── police-verification/      # Police clearance guide
│   │   ├── progress-tree-demo/       # Journey timeline
│   │   ├── signature-image-processing/ # Signature extraction
│   │   ├── tools/                    # Tools hub/dashboard
│   │   ├── visa-case-strength-checker/ # Approval predictor
│   │   └── visa-eligibility/         # Visa qualification quiz
│   │
│   ├── api/                          # Next.js API routes
│   │   ├── auth/                     # Authentication endpoints
│   │   ├── documents/                # Document management API
│   │   ├── forms/                    # Form submission endpoints
│   │   └── [dynamic routes]/         # Route handlers
│   │
│   ├── admin/                        # Admin panel (if applicable)
│   ├── book-consultation/            # Consultation booking
│   ├── components/                   # Route-specific components
│   ├── context/                      # React Context providers
│   ├── routes/                       # Route configuration
│   └── translations/                 # i18n translations
│
├── backend/                          # Python FastAPI Server
│   ├── main.py                       # FastAPI application entry point
│   ├── pyproject.toml                # Python dependencies (UV/Hatchling)
│   ├── Procfile                      # Heroku/deployment configuration
│   │
│   ├── app/                          # FastAPI application logic
│   │   ├── core/
│   │   │   └── config.py             # Configuration & settings
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── remove_bg.py      # Background removal endpoint
│   │   │       ├── iv_schedule.py    # IV schedule retrieval
│   │   │       ├── visa_checker.py   # Visa bulletin checking
│   │   │       ├── pdf_routes.py     # PDF processing endpoints
│   │   │       ├── compress.py       # PDF compression endpoint
│   │   │       └── whatsapp.py       # WhatsApp AI assistant
│   │   └── services/                 # Business logic services
│   │       └── whatsapp_assistant.py # WhatsApp RAG implementation
│   │
│   ├── modnet/                       # Deep learning models
│   │   └── [Model files for background removal]
│   ├── pdfs/                         # USCIS PDF templates
│   ├── data/                         # Static data files
│   └── scripts/                      # Utility scripts
│
├── components/                       # Reusable React components
│   ├── ui/                           # shadcn-ui components (Button, Card, etc.)
│   ├── chat/                         # Chat interface components
│   ├── magicui/                      # Magic UI advanced components
│   └── layout/                       # Layout components (Header, Footer, etc.)
│
├── data/                             # Static data & configurations
│   ├── home-page-data.ts             # Homepage content
│   ├── interview-question-bank.json  # Interview questions
│   ├── interview-intake-questionnaire.json
│   ├── cnic-guide-data.json          # CNIC guide data
│   ├── passport-guide-data.json      # Passport guide
│   ├── locations.json                # Geographic data
│   └── [other data files]
│
├── lib/                              # Utility functions & helpers
│   ├── supabase/                     # Supabase client setup & middleware
│   ├── services/                     # API service functions
│   ├── encryption.ts                 # Data encryption utilities
│   ├── imageProcessor.ts             # Image processing helpers
│   ├── pdf-operations.ts             # PDF utility functions
│   ├── stripe/                       # Stripe payment utilities
│   ├── email/                        # Email sending utilities
│   ├── notifications.ts              # Notification system
│   └── utils.ts                      # General utilities
│
├── public/                           # Static assets
│   ├── favicon.ico
│   ├── images/
│   ├── icons/
│   └── [other static files]
│
├── supabase/                         # Supabase configuration
│   ├── migrations/                   # Database migrations
│   ├── functions/                    # Edge functions
│   └── [supabase configs]
│
├── types/                            # TypeScript type definitions
│   ├── database.ts                   # Database types
│   ├── api.ts                        # API response types
│   └── [other type definitions]
│
├── scripts/                          # Node.js utility scripts
│   ├── seed-database.js              # Database seeding
│   └── [utility scripts]
│
├── documentations/                   # Project documentation
│   ├── DATABASE_TABLES_REFERENCE.md
│   ├── PROJECT_DOCUMENTATION.md
│   ├── CONSULTANT_FEATURE_DOCS.md
│   └── [other docs]
│
├── uploads/                          # Temporary file storage
│   └── [user uploads]
│
├── .env.local                        # Environment variables (local)
├── .env.production                   # Production environment config
├── .eslintrc.json                    # ESLint configuration
├── .gitignore
├── tsconfig.json                     # TypeScript configuration
├── next.config.mjs                   # Next.js configuration
├── tailwind.config.ts                # TailwindCSS configuration
├── postcss.config.mjs                # PostCSS configuration
├── package.json                      # Frontend dependencies
├── vercel.json                       # Vercel deployment config
├── components.json                   # shadcn-ui components config
├── Gemini.md                         # Gemini AI project specifications
├── README.md                         # This file
└── DEVELOPER_QUICK_SETUP.md          # Developer quick start guide
```

---

## ⚡ Core Modules

### **1. Authentication Module** (`lib/supabase/`)
- JWT token management via Supabase Auth
- Session persistence and recovery
- Multi-factor authentication (MFA) support
- Row-Level Security (RLS) policy enforcement

### **2. Image Processing Module** (`lib/imageProcessor.ts`, `backend/modnet/`)
- Background removal using Rembg (ONNX models)
- Face detection and compliance cropping
- Image compression and optimization
- Batch processing pipeline

### **3. PDF Processing Module** (`lib/pdf-operations.ts`, `backend/app/api/v1/pdf_routes.py`)
- PDF parsing and extraction
- Form field identification and mapping
- Intelligent field-value population
- PDF generation and merging
- Compression and optimization

### **4. AI/RAG Module** (`backend/app/services/whatsapp_assistant.py`)
- Vector embeddings with Sentence Transformers
- Qdrant vector database integration
- Retrieval-Augmented Generation (RAG) pipeline
- Gemini AI prompt management
- OpenAI-compatible agent framework

### **5. Document Translation Module** (`app/(tools)/document-translation/`)
- Multi-language support (Urdu, Arabic, Spanish, etc.)
- OCR integration for scanned documents
- Document format preservation
- User-specific translation history

### **6. Visa Tracking Module** (`lib/visa-checker/`)
- Real-time visa bulletin parsing
- Priority date analysis
- Wait time estimation algorithms
- Embassy scheduling data retrieval

---

## 🚀 Quick Start

### Prerequisites
- **Node.js:** v18 or higher
- **Python:** v3.10 or higher
- **Git:** Latest version
- **Supabase Account:** [Create free account](https://supabase.com)
- **Google Gemini API Key:** [Get API key]

### Installation Overview
```bash
# 1. Clone repository
git clone https://github.com/SharjeelLaeeq527/Rahvana.git
cd rahvana

# 2. Set up environment variables
Make .env.local file and add environment variables there.

# 3. Install frontend dependencies
npm install

# 4. Set up Python backend
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate
pip install -e .

# 5. Start development servers
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && uvicorn main:app --reload
```

> 📚 **For detailed step-by-step setup instructions, see** [`DEVELOPER_QUICK_SETUP.md`](./DEVELOPER_QUICK_SETUP.md)

---

## 🛠️ Development Setup

### Running the Application

**Development Mode:**
```bash
# Frontend (Next.js dev server with hot reload)
npm run dev          # Runs on http://localhost:3000

# Backend (FastAPI with auto-reload)
cd backend && uvicorn main:app --reload --port 8000
```

**Production Build:**
```bash
# Frontend
npm run build
npm start

# Backend
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

### Database Migrations
```bash
# Using Supabase CLI
supabase migration new migration_name
supabase db push
supabase db pull  # Sync local schema
```

### Testing
```bash
# Frontend tests
npm run test

# Backend tests
cd backend && pytest
```

### Code Quality
```bash
# Linting
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

---

## 📡 API Documentation

### Backend Endpoints Structure

```
FastAPI Base URL: http://localhost:8000 (dev)
```

#### **Image Processing**
```
POST /api/v1/remove-bg
Purpose: Remove background from images
Body: FormData with image file
Response: Base64 encoded image or file URL
```

#### **Visa Processing**
```
GET /api/v1/visa-checker/bulletin
Purpose: Fetch latest visa bulletin data
Query Params: visa_category, country_code
Response: JSON with priority dates and final action dates
```

#### **PDF Operations**
```
POST /api/v1/pdf-forms/fill
Purpose: Auto-fill USCIS PDF forms
Body: JSON with form fields and values
Response: Generated PDF file

POST /api/v1/pdf-compress
Purpose: Compress PDF files
Body: FormData with PDF file
Response: Compressed PDF file
```

#### **IV Schedule**
```
GET /api/v1/iv-schedule/list
Purpose: Get interview scheduling dates by embassy
Query Params: embassy_code, visa_category
Response: JSON with scheduling information
```

### Frontend API Routes

```
Base URL: http://localhost:3000 (dev)
```

All routes in `app/api/` follow RESTful conventions with proper HTTP methods (GET, POST, PUT, DELETE).

---

## 🔐 Authentication & Security

### Authentication Flow
1. **User Registration/Login** via Supabase Auth (Email, Phone, OAuth)
2. **JWT Token Generation** and storage in secure cookies
3. **Token Refresh** mechanism for session persistence
4. **Row-Level Security** enforces user data isolation at database level

### Security Best Practices
- ✅ **Environment Variables:** Sensitive keys stored in `.env.local`
- ✅ **HTTPS:** Enforced in production
- ✅ **CSRF Protection:** Token-based request validation
- ✅ **XSS Prevention:** Content Security Policy headers
- ✅ **Input Validation:** Zod schema validation on frontend, Pydantic on backend
- ✅ **Database Encryption:** Sensitive fields encrypted at rest
- ✅ **RLS Policies:** Data access controlled at row level in Supabase

### Files & Secrets
- Never commit `.env.local`
- Rotate API keys regularly
- Use Supabase's built-in secrets management

---

### Environment Configuration
Create `.env.local` with production secrets:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_key
# ... other production secrets
```

---

## 📝 Developer Notes & Best Practices

- **Adding Features:** Place new React components in `components/` and define Next.js routing within `app/`. For heavy processing or AI tasks, build a new service in `backend/app/services/` and expose it via FastAPI.
- **Supabase Integration:** The frontend uses `@supabase/ssr` for auth and light data fetching. The backend interacts with Supabase using the official Python client for heavy vector/RAG queries.
- **Stripe Testing:** Review `STRIPE_TESTING.md` and `STRIPE_PRICE_SETUP.md` to configure correct testing price IDs.

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Guidelines
- Follow existing code style and patterns
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before pushing

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## 📞 Support & Questions

- 📧 Email: support@rahvana.com

---

## 🙏 Acknowledgments

Thank you to all contributors and supporters who make Rahvana possible. Together, we're making immigration processes simpler and more accessible for everyone.

**Made with ❤️ by the Rahvana Team**

*(This documentation is continuously updated as new features are rolled out.)*
