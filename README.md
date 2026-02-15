# 🚀 Code Analysis Assistant

## 🎯 The Problem

Traditional code search tools rely on keyword matching, returning entire
files or irrelevant results.

When developers ask:

-   *"Where is the login function defined?"* → Get 47 results across 12
    files\
-   *"Explain the execute method"* → Get the entire 200-line class file\
-   *"How does authentication work?"* → Manual reading through multiple
    files

Developers waste hours manually navigating large codebases.

------------------------------------------------------------------------

## ✨ The Solution

An intelligent AI-powered assistant that:

-   ✅ **Understands code structure** -- Parses code like a compiler
    (functions, classes, methods)
-   ✅ **Classifies user intent** -- Knows if you want a definition,
    explanation, or file search
-   ✅ **Returns precise answers** -- Shows only the requested symbol,
    not entire files
-   ✅ **Transparent reasoning** -- Displays real-time agent thinking
    process

------------------------------------------------------------------------

## 🏗️ Architecture Overview

### 🔹 System Layers

-   **Frontend**: Next.js + Real-time Agent Thinking UI\
-   **API Layer**: `/api/upload` \| `/api/query`\
-   **Indexing Pipeline**: AST parsing + symbol extraction\
-   **Query Pipeline**: Intent classification + tool execution

------------------------------------------------------------------------

## 📥 Indexing Pipeline (Upload Flow)

### Key Steps

1.  **Clone Repository** -- Download from GitHub\
2.  **Parse Files** -- Extract code using TypeScript Compiler API\
3.  **Symbol Extraction** -- Identify functions, classes, methods,
    interfaces\
4.  **Dual Indexing**:
    -   **Symbols Table** → Exact lookups (name, location, signature)
    -   **Vector Store** → Semantic search (embedded code chunks)
5.  **Linking** -- Connect chunks to symbols via `symbol_id`

### Example Indexing Output

    Repository: my-app (27 files)
    ├─ V1 Indexing: 27 line-based chunks
    ├─ V2 Indexing: 68 symbols extracted
    │   ├─ 15 functions
    │   ├─ 8 classes
    │   ├─ 32 methods
    │   ├─ 10 interfaces
    │   └─ 3 types
    └─ Status: ✅ Ready for queries

------------------------------------------------------------------------

## 🔍 Query Pipeline (Chat Flow)

### Supported Intents

-   `explain_symbol`
-   `find_definition`
-   `find_files`
-   `explain_file`
-   `generate_tests`
-   `list_files`
-   `explain_concept`

### Example Query

**Query:**

    explain the execute method

**Agent Process:**

-   ✓ Analyzing query\
-   ✓ Intent: `explain_symbol` (95% confidence)\
-   ✓ Extracted: `{ symbolName: "execute" }`\
-   ✓ Executing: `symbol-explain`

**Result:**\
Precise explanation of just the `execute` method --- not the entire
file.

------------------------------------------------------------------------

## 📦 Installation

### Prerequisites

-   Node.js \>= 18.x\
-   npm or yarn\
-   Supabase account\
-   OpenAI API key

### 1️⃣ Clone Repository

    git clone https://github.com/yourusername/code-analysis-assistant.git
    cd code-analysis-assistant

### 2️⃣ Install Dependencies

    npm install

### 3️⃣ Set Up Supabase

-   Create a new project at https://supabase.com\
-   Run database migrations (see `tables.sql`)

### 4️⃣ Configure Environment Variables

Create `.env.local`:

    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_anon_key

    # OpenAI
    OPENAI_API_KEY=your_openai_api_key

    # Optional
    GITHUB_TOKEN=your_github_token

### 5️⃣ Start Development Server

    npm run dev

Open: http://localhost:3000

------------------------------------------------------------------------

## 📖 Usage

### Step 1: Upload Repository

1.  Go to Dashboard\
2.  Click "Upload Repository"\
3.  Enter GitHub URL\
4.  Click "Index Repository"

**Indexing Progress Example:**

    📦 Cloning repository...
    🔍 Parsing 27 files...
    💾 Extracting 68 symbols...
    🧠 Generating embeddings...
    ✅ Repository indexed successfully!

------------------------------------------------------------------------

### Step 2: Query Your Codebase

#### Example: Find Authentication Files

    find files that handle authentication

**Result:**

1.  `src/auth/authService.ts`
2.  `src/middleware/auth.middleware.ts`

------------------------------------------------------------------------

## 🗄️ Database Schema

  Table               Purpose
  ------------------- -----------------------------
  repositories        Store repo metadata
  files               File contents
  symbols             Functions, classes, methods
  code_chunks         Embedded code chunks
  symbol_references   Call graph (planned)
  file_dependencies   Import graph (planned)

### Relationships

-   One repository → Many files\
-   One file → Many symbols\
-   One symbol → Many code chunks

------------------------------------------------------------------------

## 🛠️ Tech Stack

-   **Frontend**: Next.js 14, React, TypeScript\
-   **Backend**: Node.js API Routes\
-   **Database**: PostgreSQL + pgvector (Supabase)\
-   **AI**: OpenAI GPT-4o-mini\
-   **Parsing**: TypeScript Compiler API

