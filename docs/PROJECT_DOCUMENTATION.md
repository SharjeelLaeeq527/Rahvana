# ARACHNIE - Complete Project Documentation


## PROJECT OVERVIEW

**Arachnie** ek immigration visa assistance application hai jo:
- **Frontend**: Next.js 15 + TypeScript + React 19
- **Backend**: Python FastAPI (PDF processing, background removal, form handling)
- **Database**: Supabase (authentication + data storage)

---

## ROOT LEVEL FILES

| File | Description |
|------|-------------|
| `.env.local` | Local environment variables (API keys, secrets) |
| `.eslintrc.json` | ESLint rules for code quality |
| `.gitignore` | Git ignore rules |
| `components.json` | shadcn/ui component configuration |
| `next.config.ts` | Next.js configuration settings |
| `tsconfig.json` | TypeScript compiler options |
| `tailwind.config.ts` | Tailwind CSS customization |
| `postcss.config.mjs` | PostCSS plugins config |
| `vercel.json` | Vercel deployment settings |
| `package.json` | NPM dependencies + scripts |
| `README.md` | Project overview + API docs |
| `documentation.md` | Additional project docs |
| `Gemini.md` | Gemini AI integration notes |

---

## /app - Main Next.js Application

Yeh folder Next.js App Router use karta hai. Sab pages aur components yahan hain.

### /app/(auth) - Authentication Pages

| File | Description |
|------|-------------|
| `login/page.tsx` | Login page - user sign in form |
| `signup/page.tsx` | Signup page - new user registration |
| `complete-profile/page.tsx` | Profile completion - additional user info collect karna |

### /app/(main) - Main Application Pages

| File | Description |
|------|-------------|
| `dashboard/page.tsx` | User dashboard - main landing after login |
| `initial-questions/page.tsx` | Onboarding questions - first time user info gather karna |

### /app/(tools) - Utility Tools Pages

| File | Description |
|------|-------------|
| `passport/page.tsx` | Passport photo generator - photo resize + background removal |
| `pdf-processing/page.tsx` | PDF editor - signatures, text, merge, compress |
| `signature-image-processing/page.tsx` | Signature tool - signature extract aur clean karna |

### /app/(visa) - Visa Related Pages

| File | Description |
|------|-------------|
| `visa-category/ir-category/page.tsx` | IR visa category info page |
| `visa-checker/page.tsx` | Visa status checker - priority date check karna |
| `visa-checker/result/page.tsx` | Visa checker results display |
| `ir-1-roadmap/page.tsx` | IR-1 visa roadmap - step by step guide |
| `iv-tool/page.tsx` | Immigrant Visa scheduling tool |
| `visa-forms/page.tsx` | Available visa forms list |
| `visa-forms/[formCode]/wizard/page.tsx` | Dynamic form wizard - auto-fill visa forms |

### /app/api - Backend API Routes

| File | Description |
|------|-------------|
| `chat/route.ts` | AI chat endpoint - Gemini integration |
| `convert-pdf/route.ts` | PDF format conversion API |
| `create-pdf/route.ts` | PDF creation API |
| `iv-status/route.ts` | IV scheduling status API |
| `merge/route.ts` | PDF merge API - multiple PDFs combine karna |

---

## /app/components - React Components

### /app/components/auth

| File | Description |
|------|-------------|
| `ProtectedRoute.tsx` | Route protection - logged in users only |

### /app/components/chat

| File | Description |
|------|-------------|
| `ChatInterface.tsx` | Main chat UI - AI assistant ke sath baat |
| `FloatingChatWidget.tsx` | Floating chat button - screen par har jagah dikhe |

### /app/components/forms/auth

| File | Description |
|------|-------------|
| `CompleteProfileForm.tsx` | Profile form - additional user details |
| `SignupForm.tsx` | Signup form component |

### /app/components/forms/onboarding

| File | Description |
|------|-------------|
| `InitialQuestionsForm.tsx` | Initial questions - user ki immigration journey samajhna |

### /app/components/forms/auto-visaform-filling

| File | Description |
|------|-------------|
| `FormStep.tsx` | Single step component - ek form field group |
| `MultiStepForm.tsx` | Multi-step container - saare steps manage karna |
| `ProgressBar.tsx` | Progress indicator - kitna complete hua |
| `ReviewPage.tsx` | Review page - submit se pehle sab check karna |

### /app/components/IR-pathway-roadmap

| File | Description |
|------|-------------|
| `Avatar.tsx` | User avatar component |
| `CompletionDialog.tsx` | Task complete hone par dialog |
| `IslandCard.tsx` | Island card - roadmap mein ek step represent karta hai |
| `ProgressBar.tsx` | Roadmap progress bar |
| `StepDialog.tsx` | Step details dialog - click par info dikhana |

### /app/components/layout

| File | Description |
|------|-------------|
| `SiteHeader.tsx` | Header/Navigation bar - logo, links, user menu |
| `ClientWidgets.tsx` | Client-side widgets loader |

### /app/components/pdf-editor - PDF Editor Components

| File | Description |
|------|-------------|
| `PdfEditor.tsx` | Main PDF editor - saari editing functionality |
| `PdfUpload.tsx` | PDF upload component - drag & drop support |
| `PdfViewer.tsx` | PDF viewer - PDF render karna canvas par |
| `PdfThumbnails.tsx` | Thumbnails - sab pages ki chhoti images |

#### /app/components/pdf-editor/pages

| File | Description |
|------|-------------|
| `OrganizePagesModal.tsx` | Pages organize karna - reorder, delete |

#### /app/components/pdf-editor/shapes

| File | Description |
|------|-------------|
| `DraggableShape.tsx` | Draggable shapes - move aur resize |
| `ShapesTool.tsx` | Shapes add karna - rectangle, circle, line |
| `ShapeFormattingToolbar.tsx` | Shape formatting - color, border, fill |

#### /app/components/pdf-editor/signature

| File | Description |
|------|-------------|
| `SignaturePad.tsx` | Signature draw karna - mouse/touch se |
| `SignatureUploader.tsx` | Signature image upload |
| `DraggableSignature.tsx` | Signature PDF par place karna |
| `SignatureProcessor.tsx` | Signature process karna - background remove |
| `SignatureTool.tsx` | Main signature tool - saare options |
| `ImageFilterEditor.tsx` | Image filters - brightness, contrast |
| `CropTool.tsx` | Image crop karna |
| `TiltCorrectionTool.tsx` | Tilt fix karna - image straighten |
| `TextSignature.tsx` | Text se signature banana - fonts use karke |
| `SignaturePreview.tsx` | Signature preview dikhana |
| `UploadImage.tsx` | General image upload interface |

#### /app/components/pdf-editor/text

| File | Description |
|------|-------------|
| `DraggableTextPro.tsx` | Text PDF par add aur move karna |
| `EditTextModal.tsx` | Text edit dialog - content change |
| `TextFormattingToolbar.tsx` | Text formatting - font, size, color |

#### /app/components/pdf-editor/tools

| File | Description |
|------|-------------|
| `ColorPicker.tsx` | Color selection tool |

### /app/components/pdf-tools

| File | Description |
|------|-------------|
| `CompressPdf.tsx` | PDF compress karna - file size kam |
| `PdfConverter.tsx` | PDF convert karna - different formats |
| `PdfMerge.tsx` | PDFs merge karna - combine into one |
| `MultiFormatConverter.tsx` | Multiple format support converter |

### /app/components/visa-checker

| File | Description |
|------|-------------|
| `Form.tsx` | Visa checker input form |
| `Result.tsx` | Visa status result display |

### /app/components/shared

| File | Description |
|------|-------------|
| `SelectionHandles.tsx` | Resize/move handles - objects ke liye |

---

## /app/context

| File | Description |
|------|-------------|
| `AuthContext.tsx` | Authentication context - user state manage karna |

---

## /app/lib

| File | Description |
|------|-------------|
| `pdf-operations.ts` | PDF manipulation utilities - merge, split, etc. |

---

## /app Root Files

| File | Description |
|------|-------------|
| `page.tsx` | Home page - landing page |
| `layout.tsx` | Root layout - common structure |
| `globals.css` | Global CSS styles |
| `global.d.ts` | Global TypeScript declarations |

---

## /backend - Python FastAPI Backend

### Root Files

| File | Description |
|------|-------------|
| `main.py` | FastAPI app entry point - server start yahan se |
| `pyproject.toml` | Python dependencies + project config |
| `uv.lock` | Package lock file |
| `.env` | Backend environment variables |

### /backend/app/api/v1 - API Endpoints

| File | Description |
|------|-------------|
| `compress.py` | PDF compression endpoint |
| `pdf_routes.py` | PDF manipulation routes - fill, merge, etc. |
| `remove_bg.py` | Background removal - image se background hatana |
| `visa_checker.py` | Visa bulletin checking - priority dates |
| `iv_schedule.py` | IV interview scheduling info |
| `whatsapp.py` | WhatsApp webhook integration |

### /backend/app/core - Core Configuration

| File | Description |
|------|-------------|
| `config.py` | Application configuration settings |

#### /backend/app/core/form_configs

| File | Description |
|------|-------------|
| `i130_config.py` | I-130 form field mapping - kaunsa field kahan |
| `i864_config.py` | I-864 form field mapping |

### /backend/app/services - Business Logic

| File | Description |
|------|-------------|
| `pdf_filler.py` | PDF form auto-fill service |
| `matting_service.py` | Image matting - background removal AI model |
| `scraper_service.py` | Web scraping - visa bulletin data |

#### /backend/app/services/whatsapp_assistant

| File | Description |
|------|-------------|
| `config.py` | WhatsApp bot configuration |
| `database.py` | Database operations for bot |
| `main.py` | WhatsApp bot main logic |
| `tools.py` | Bot commands aur tools |

### /backend/data

| File | Description |
|------|-------------|
| `iv_data.json` | IV scheduling data (JSON format) |
| `iv_data.csv` | IV scheduling data (CSV format) |
| `debug.html` | Scraper debug output |

### /backend/logs

| File | Description |
|------|-------------|
| `scraper.log` | Visa bulletin scraper logs |

### /backend/pdfs - Form Templates

| File | Description |
|------|-------------|
| `i130.pdf` | I-130 form blank template |
| `i864.pdf` | I-864 form blank template |

### /backend/scripts

| File | Description |
|------|-------------|
| `run_scraper.py` | Visa bulletin scraper script |

### /backend/modnet - AI Model (Git Submodule)

| Folder/File | Description |
|-------------|-------------|
| `src/models/modnet.py` | MODNet model - background removal neural network |
| `src/models/backbones/` | Neural network backbones |
| `checkpoints/` | Pre-trained model weights |
| `demo/` | Demo scripts |

---

## /components - Shared UI Component Library

### /components/ui - shadcn/ui Components

| File | Description |
|------|-------------|
| `button.tsx` | Button component - different variants |
| `card.tsx` | Card component - content wrapper |
| `input.tsx` | Input field - text input |
| `label.tsx` | Form label |
| `textarea.tsx` | Multi-line text input |
| `checkbox.tsx` | Checkbox input |
| `radio-group.tsx` | Radio button group |
| `select.tsx` | Dropdown select |
| `dialog.tsx` | Modal dialog |
| `dropdown-menu.tsx` | Dropdown menu |
| `progress.tsx` | Progress bar |
| `scroll-area.tsx` | Custom scrollable area |
| `sheet.tsx` | Side drawer/sheet |
| `badge.tsx` | Badge/tag component |
| `spinner.tsx` | Loading spinner |
| `form.tsx` | React Hook Form utilities |

---

## /lib - Shared Utilities

| File | Description |
|------|-------------|
| `utils.ts` | General utility functions (cn, etc.) |
| `store.ts` | Zustand global state store |
| `steps.ts` | Form wizard steps configuration |
| `imageProcessor.ts` | Image processing utilities |
| `pdf-utils.ts` | PDF helper functions |
| `supabaseClient.ts` | Supabase client setup |

### /lib/formConfig - Form Configurations

| File | Description |
|------|-------------|
| `index.ts` | Form config exports |
| `types.ts` | Form field type definitions |
| `i130.ts` | I-130 form fields + validation |
| `i864.ts` | I-864 form fields + validation |

---

## /types - TypeScript Definitions

| File | Description |
|------|-------------|
| `pdfjs-dist.d.ts` | PDF.js library types |
| `dom-to-image-more.d.ts` | DOM to image library types |

---

## /public - Static Assets

| File | Description |
|------|-------------|
| `pdf.worker.min.js` | PDF.js web worker |
| `*.pdf` | Sample/converted PDF files |

---

## /tests - Test Files

| File | Description |
|------|-------------|
| `merge.test.ts` | PDF merge functionality tests |

---

## TECH STACK SUMMARY

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI (shadcn/ui)
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Auth**: Supabase Auth
- **PDF**: PDF.js, pdf-lib
- **OCR**: Tesseract.js
- **Image**: OpenCV.js

### Backend
- **Framework**: FastAPI (Python 3.11)
- **PDF**: PyPDF2, PDFKit
- **Image**: OpenCV, MODNet
- **Scraping**: BeautifulSoup4
- **Database**: Supabase

### Deployment
- **Frontend**: Vercel
- **Backend**: Any Python host
- **Database**: Supabase Cloud

---

## KEY FEATURES

1. **PDF Processing**
   - Auto-fill visa forms (I-130, I-864)
   - Merge, compress, convert PDFs
   - Add signatures, text, shapes

2. **Visa Tools**
   - Priority date checker
   - IV schedule lookup
   - IR-1 roadmap guide

3. **Image Processing**
   - Passport photo generator
   - Background removal
   - Signature extraction

4. **AI Assistant**
   - Chat interface
   - Document help

5. **WhatsApp Bot**
   - Automated responses
   - Form help

---

## FOLDER STRUCTURE DIAGRAM

```
Arachnie/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── complete-profile/
│   ├── (main)/                   # Main pages
│   │   ├── dashboard/
│   │   └── initial-questions/
│   ├── (tools)/                  # Tool pages
│   │   ├── passport/
│   │   ├── pdf-processing/
│   │   └── signature-image-processing/
│   ├── (visa)/                   # Visa pages
│   │   ├── visa-category/
│   │   ├── visa-checker/
│   │   ├── ir-1-roadmap/
│   │   ├── iv-tool/
│   │   └── visa-forms/
│   ├── api/                      # API routes
│   ├── components/               # React components
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── forms/
│   │   ├── IR-pathway-roadmap/
│   │   ├── layout/
│   │   ├── pdf-editor/
│   │   ├── pdf-tools/
│   │   ├── visa-checker/
│   │   └── shared/
│   ├── context/                  # React contexts
│   └── lib/                      # App utilities
├── backend/                      # Python FastAPI
│   ├── app/
│   │   ├── api/v1/              # API endpoints
│   │   ├── core/                # Configuration
│   │   └── services/            # Business logic
│   ├── data/                    # Data files
│   ├── pdfs/                    # PDF templates
│   ├── scripts/                 # Utility scripts
│   └── modnet/                  # AI model (submodule)
├── components/                   # Shared UI components
│   └── ui/                      # shadcn/ui
├── lib/                         # Shared utilities
│   └── formConfig/              # Form configurations
├── types/                       # TypeScript types
├── public/                      # Static assets
└── tests/                       # Test files
```

---

## QUICK REFERENCE

| Kya dhundna hai? | Kahan dekhein? |
|------------------|----------------|
| Login/Signup | `app/(auth)/` |
| Dashboard | `app/(main)/dashboard/` |
| PDF Editor | `app/components/pdf-editor/` |
| Visa Checker | `app/(visa)/visa-checker/` |
| API Routes | `app/api/` |
| Backend APIs | `backend/app/api/v1/` |
| UI Components | `components/ui/` |
| Form Configs | `lib/formConfig/` |
| State Management | `lib/store.ts` |
| Auth Context | `app/context/AuthContext.tsx` |

---

*Last Updated: December 2024*
*Generated for Arachnie Team*
