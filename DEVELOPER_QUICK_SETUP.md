# 🚀 Rahvana Developer Quick Setup Guide

Complete step-by-step instructions to set up the Rahvana project locally for development.

**Time to Complete:** ~30-45 minutes (depending on download speeds)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Setup](#system-setup)
3. [Frontend Setup](#frontend-setup)
4. [Backend Setup](#backend-setup)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Running the Application](#running-the-application)
8. [Troubleshooting](#troubleshooting)
9. [Next Steps](#next-steps)

---

## ✅ Prerequisites

### Required Software
Before starting, ensure you have the following installed:

#### **Windows**
1. **Node.js (v18+)** - Download from https://nodejs.org/
   ```bash
   # Verify installation
   node --version
   npm --version
   ```

2. **Python (v3.10+)** - Download from https://www.python.org/
   - **IMPORTANT:** During installation, check "Add Python to PATH"
   ```bash
   # Verify installation
   python --version
   pip --version
   ```

3. **Git** - Download from https://git-scm.com/
   ```bash
   git --version
   ```

4. **Visual Studio Code** - Download from https://code.visualstudio.com/
   - Recommended extensions:
     - Python (Microsoft)
     - Pylance (Microsoft)
     - ES7+ React/Redux/React-Native snippets
     - Thunder Client or Postman (for API testing)

#### **macOS**
```bash
# Using Homebrew (install from https://brew.sh/)
brew install node
brew install python@3.10
brew install git
```

#### **Linux (Ubuntu)**
```bash
sudo apt update
sudo apt install nodejs npm python3.10 python3-pip git
```

### Accounts Required
- 🔗 **Supabase** - [Sign up free](https://supabase.com)
- 🤖 **Google Gemini API** - [Get free API key]
- 💳 **Stripe** (Optional)

---

## 🖥️ System Setup

### Step 1: Clone the Repository

```bash
# Clone the Rahvana repository
git clone https://github.com/SharjeelLaeeq/Rahvana.git

# Navigate into the project folder
cd Rahvana
```

### Step 2: Open Project in VS Code

```bash
# Open project in VS Code
code .

# Or manually: File → Open Folder → Select 'rahvana' folder
```

### Step 3: Open Integrated Terminal in VS Code

```
Ctrl + ` (backtick)    # Windows/Linux
Cmd + ` (backtick)     # macOS
```

---

## 📦 Frontend Setup

### Step 1: Install Node Dependencies

```bash
# From the root directory (rahvana/)
npm install

# This will install all dependencies listed in package.json
# Takes 3-5 minutes depending on internet speed
```

**Expected Output:**
```
up to date, audited 250+ packages in 2.34s
added [X] packages
```

### Step 2: Verify Installation

```bash
# Check if all key packages are installed
npm list next react typescript

# Should show:
# ├── next@15.5.7
# ├── react@19.1.0
# └── typescript@5.x.x
```

### Step 3: Create Environment File

```bash
# Copy environment template to local configuration
Make .env.local
```

**Windows (PowerShell):**
```powershell
Make ".env.local"
```

---

## 🐍 Backend Setup

### Step 1: Navigate to Backend Folder

```bash
# From the root directory
cd backend
```

### Step 2: Create Python Virtual Environment

#### **Windows (PowerShell)**
```powershell
# Create virtual environment
python -m venv .venv

# Activate it
.\.venv\Scripts\Activate.ps1

# If you get execution policy error, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### **Windows (Command Prompt)**
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

#### **macOS/Linux**
```bash
# Create and activate virtual environment
python3.10 -m venv .venv
source .venv/bin/activate
```

**Verify Activation:**
```bash
# You should see (.venv) prefix in terminal
# Example: (.venv) user@computer rahvana/backend $
```

### Step 3: Upgrade pip

```bash
# Ensure pip is up to date
python -m pip install --upgrade pip

# On macOS/Linux if needed:
python3 -m pip install --upgrade pip
```

### Step 4: Install Python Dependencies

```bash
# Install dependencies from pyproject.toml
pip install -e .

# This installs:
# - FastAPI and Uvicorn
# - Image processing (Rembg, OpenCV, Pillow)
# - PDF processing (pypdf, reportlab, pdfplumber)
# - AI/ML (openai, sentence-transformers, qdrant-client)
# - Database (supabase)
# - And many more...

# Takes 5-10 minutes depending on internet
```

**Alternative (if using UV package manager):**
```bash
# Install UV first
pip install uv

# Then install dependencies
uv pip install -e .
```

### Step 5: Verify Backend Installation

```bash
# Test FastAPI can start
python -c "import fastapi; print(f'FastAPI version: {fastapi.__version__}')"

# Test other key packages
python -c "import rembg, cv2, pydantic; print('All imports successful!')"
```

### Step 6: Create Backend Environment File

```bash
# While still in backend folder, create .env
cd ..  # Go back to root

# Create backend .env file
copy .env.backend.example backend/.env
```

**Windows:**
```powershell
Copy-Item ".env.backend.example" "backend\.env" -Force
```

---

## 🗄️ Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Join Rahvana's Project

### Step 2: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (from ANON/SERVICE_ROLE section)
   - **Anon Key** (public key)
   - **Service Role Key** (secret key)

### Step 3: Create Database Tables

The database will be initialized with migrations. Follow these steps:

```bash
# Install Supabase CLI (optional, for advanced setup)
npm install -g supabase

# Or use the Supabase dashboard to run SQL scripts
```

**Using Supabase Dashboard:**
1. Go to **SQL Editor** in Supabase dashboard
2. Click "New Query"
3. Paste SQL migration files from `supabase/migrations/`
4. Click "Run"

**Or import via CLI:**
```bash
# If you have Supabase CLI installed
supabase db pull         # Pull production schema
supabase db push         # Push local migrations
```

### Step 4: Enable Row-Level Security (RLS)

In Supabase dashboard:

1. Go to **Authentication** → **Policies**
2. Enable RLS on these tables:
   - `translation_documents`
   - `user_documents`
   - `consultation_bookings`
   - etc.

3. Create policies for user data access (templates provided in docs)

---

## 🔐 Environment Configuration

### Step 1: Update `.env.local` (Frontend)

Create/Update `c:\Users\DELL\Desktop\Arachnie\Arachnie Development\Rahvana\.env.local`:

```env
# ============ SUPABASE ============
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# ============ BACKEND ============
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL_PROD=https://api.yourdomain.com

# ============ GEMINI AI ============
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key_here

# ============ STRIPE (Optional) ============
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# ============ OTHER ============
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 2: Update `backend/.env` (Backend)

Create/Update `c:\Users\DELL\Desktop\Arachnie\Arachnie Development\Rahvana\backend\.env`:

```env
# ============ FASTAPI ============
PROJECT_NAME=Rahvana Backend
VERSION=0.1.0
DEBUG=True
ENVIRONMENT=development

# ============ SUPABASE ============
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# ============ GEMINI AI ============
GEMINI_API_KEY=your_gemini_key_here

# ============ CORS ============
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","https://yourdomain.com"]

# ============ DATABASE ============
DATABASE_URL=postgresql://user:password@localhost:5432/rahvana

# ============ OTHER ============
LOG_LEVEL=INFO
MAX_UPLOAD_SIZE=52428800  # 50MB in bytes
```

### Step 3: Verify Environment Variables

**Frontend:**
```bash
# In root directory (rahvana/)
npm run env:check
```

**Backend:**
```bash
# In backend directory
python -c "from app.core.config import settings; print(settings.PROJECT_NAME)"
```

---

## 🎯 Running the Application

### Step 1: Terminal Setup

You need **2 separate terminals** running simultaneously:
- **Terminal 1:** Frontend server (Next.js)
- **Terminal 2:** Backend server (FastAPI)

You can open multiple terminals in VS Code:
```
Terminal → New Terminal (or Ctrl + Shift + `)
```

### Step 2: Start Frontend Server

**In Terminal 1 (root directory):**

```bash
# Make sure you're in the root directory (rahvana/)
# Verify with: pwd

npm run dev
```

**Expected Output:**
```
> rahvana-frontend@0.1.0 dev
> next dev

  ▲ Next.js 15.5.7
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.3s
```

✅ **Frontend is running:** Open browser and visit http://localhost:3000

### Step 3: Start Backend Server

**In Terminal 2 (backend directory):**

```bash
# Navigate to backend folder
cd backend

# Make sure virtual environment is activated
# You should see (.venv) prefix

# Start FastAPI server
uvicorn main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

✅ **Backend is running:** Visit http://localhost:8000/docs for API documentation

### Step 4: Test the Setup

Open a **3rd terminal** and run these tests:

```bash
# Test frontend
curl http://localhost:3000

# Test backend
curl http://localhost:8000/health

# Should return: {"status": "healthy"}

# Test Supabase connection
curl http://localhost:8000/
# Should return: {"message": "Arachnie API Live"}
```

### Step 5: Access the Application

1. **Frontend:** http://localhost:3000
2. **Backend API Docs:** http://localhost:8000/docs (interactive Swagger)
3. **Backend ReDoc:** http://localhost:8000/redoc (alternative documentation)

---

## 🧪 Development Workflow

### Making Changes

#### **Frontend Changes**
1. Edit `.tsx` or `.ts` files in `app/` or `components/` folders
2. Next.js hot-reloads automatically
3. Check the browser for live updates

#### **Backend Changes**
1. Edit `.py` files in `backend/app/` folder
2. FastAPI auto-reloads due to `--reload` flag
3. Check terminal for any errors

### Debugging

#### **Frontend Debugging**
```bash
# Open DevTools in browser
F12 or Ctrl+Shift+I

# Use React Developer Tools extension
# Check Console tab for errors
```

#### **Backend Debugging**
```bash
# Add print statements in Python code:
print(f"DEBUG: {variable_name}")

# Or add breakpoints using Python Debugger:
import pdb; pdb.set_trace()

# Check terminal output for logs
```

### Testing API Endpoints

Use Thunder Client (VS Code extension) or Postman:

```
POST http://localhost:8000/api/v1/remove-bg
Headers: Content-Type: multipart/form-data
Body: Select image file
```

---

## ❌ Troubleshooting

### Common Issues & Solutions

#### **1. Port Already in Use**

**Error:** `Address already in use: ('127.0.0.1', 3000)`

**Solution:**
```bash
# Kill process using the port
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :3000
kill -9 <PID>

# Or use different port:
npm run dev -- -p 3001
```

#### **2. Virtual Environment Not Activated**

**Error:** `'python' is not recognized as an internal or external command`

**Solution:**
```bash
# Make sure you're in backend folder
cd backend

# Activate virtual environment
.\.venv\Scripts\Activate  # Windows
source .venv/bin/activate  # macOS/Linux

# Verify (.venv) appears in terminal
```

#### **3. Module Not Found Errors**

**Error:** `ModuleNotFoundError: No module named 'rembg'`

**Solution:**
```bash
# Reinstall Python dependencies
cd backend
pip install -e .

# If still fails, try:
pip install --upgrade --force-reinstall -e .
```

#### **4. Supabase Connection Failed**

**Error:** `Connection refused` or `Invalid API key`

**Solution:**
1. Check `.env.local` and `backend/.env` are correctly filled
2. Verify Supabase project is active
3. Confirm API keys from Supabase dashboard
4. Test connection:
   ```bash
   python -c "from supabase import create_client; client = create_client(url, key)"
   ```

#### **5. Gemini API Key Invalid**

**Error:** `Invalid API key provided` or `403 Forbidden`

**Solution:**
1. Get new API key from [makersuite.google.com](https://makersuite.google.com/app/apikey)
2. Ensure you enabled Generative AI API (not just create key)
3. Update `.env.local` and restart servers
4. Test:
   ```bash
   curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY
   ```

#### **6. npm install Takes Too Long or Fails**

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install

# If still fails, try offline mode:
npm install --prefer-offline

# Or use yarn if available:
yarn install
```

#### **7. Python 3.10 Not Found**

**Error:** `'python3.10' is not recognized`

**Solution:**
```bash
# Check Python version
python --version

# If it's 3.11+, you can use it (should work fine):
python -m venv .venv

# Or install Python 3.10 specifically from python.org
```

#### **8. npm ERR! code EACCES (Permission Denied)**

**Error:** `npm ERR! code EACCES permission denied`

**Solution:**
```bash
# Use sudo (not ideal, but works)
sudo npm install -g npm@latest

# Or fix npm permissions permanently
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
# Add ~/.npm-global/bin to PATH
```

---

## 📚 Next Steps

### After Successful Setup

1. **Create a Test User:**
   - Navigate to http://localhost:3000
   - Sign up with test email and password
   - Verify email in Supabase Auth dashboard

2. **Explore API Endpoints:**
   - Visit http://localhost:8000/docs
   - Try POST requests in Swagger UI
   - Test image upload/processing features

3. **Review Code Structure:**
   - Check `app/page.tsx` (homepage)
   - Review `backend/app/api/v1/` (endpoints)
   - Explore `components/` (React components)

4. **Set Up Database Locally (Optional):**
   ```bash
   # Install PostgreSQL for local development
   # Then connect via local connection string instead of Supabase
   ```

5. **Enable Hot Reload for Backend:**
   ```bash
   # Already enabled with --reload flag
   # But for production:
   cd backend && uvicorn main:app --port 8000
   ```

6. **Learn the Code Conventions:**
   - Read [README.md](./README.md) for full documentation
   - Check comments in key files
   - Review existing patterns before writing new code

7. **Set Up Git (if not done):**
   ```bash
   git config user.name "Your Name"
   git config user.email "your.email@example.com"
   
   # Create a feature branch
   git checkout -b feature/your-feature-name
   ```

---

## 📖 Useful Commands Cheat Sheet

### Frontend Commands
```bash
npm run dev              # Start development server
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript check
npm run format           # Format code with Prettier
```

### Backend Commands
```bash
# From backend folder
uvicorn main:app --reload           # Start with auto-reload
uvicorn main:app --host 0.0.0.0     # Make accessible externally
pytest                              # Run tests
black .                             # Format Python code
pylint app/                         # Lint Python code
```

### Git Commands
```bash
git status              # Check changed files
git add .               # Stage changes
git commit -m "msg"     # Commit with message
git push                # Push to repository
git pull                # Pull latest changes
git checkout -b feat/x  # Create feature branch
```

---

## 🆘 Need Help?

1. **Check Troubleshooting Section** above
2. **Review README.md** for full documentation
3. **Check error messages carefully** - they often tell you the solution
4. **Search GitHub issues** for similar problems
5. **Contact team** with error logs and steps taken

---

## ✨ Congratulations! 

You're ready to develop on Rahvana! 🎉

Happy coding! 💻

---

**Last Updated:** March 2026  
**For issues or updates:** Submit a GitHub issue or PR