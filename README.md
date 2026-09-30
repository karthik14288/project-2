# Unify — A Cross-Modal AI Understanding Platform

> A single unified AI pipeline that ingests text, images, audio, video, and documents, converts them into a shared 768-dimensional vector space, and answers questions by reasoning across all modalities together with verifiable citation trails.

---

## 🌟 Core Architecture & Key Features

1. **Native Multimodal Ingestion**:
   - Supports simultaneous ingestion of `.pdf`, `.mp3`, `.wav`, `.mp4`, `.jpg`, `.png`, and `.txt` up to 50MB per file.
   - Leverages **Gemini 1.5 Multimodal AI** to extract text, OCR diagrams, and audio transcripts with precise locations (timestamps `MM:SS`, document page numbers, and spatial sectors).

2. **Unified Vector Index (pgvector)**:
   - Extracted multimodal chunks are embedded into a **768-dimensional vector space** using Gemini text-embedding.
   - Cross-modal cosine similarity search powered by PostgreSQL `vector(768)` with HNSW indexing.

3. **Domain Lenses**:
   - Dynamic prompt adaptation across:
     - 🎓 **Education**: Focuses on lecture recordings, handouts, and whiteboard notes (outputs page numbers, video timestamps).
     - 🩺 **Healthcare**: Focuses on doctor voice memos and scanned lab reports (correlates clinical notes with metric analysis).
     - 🌾 **Agriculture**: Focuses on farmer voice notes, soil sensor reports, and drone photos (diagnoses crop issues like nitrogen deficiency causing leaf yellowing).

4. **Verifiable Citation Trails & Native Media Viewer**:
   - Every claim is accompanied by inline clickable citation badges: `[File Name: Timestamp / Page / Sector]`.
   - Clicking a citation opens the **SourceViewerModal**, automatically synchronizing audio/video playback to the cited timestamp, zooming into the image sector, or rendering the cited PDF page.

5. **Row Level Security (RLS) & JWT Security**:
   - All backend routes verify the user's Supabase JWT in the `Authorization: Bearer` header.
   - User ID is strictly extracted server-side and never trusted from the client payload.

---

## 📁 Repository Structure

```
unify-monorepo/
├── client/                     # React (Vite) + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/         # AuthGuard, Navbar, FileUploader, LensSelector, ChatInterface, CitationBadge, SourceViewerModal
│   │   ├── pages/              # AuthPage (/), DashboardPage (/dashboard), IngestPage (/ingest), LensPage (/lens/:lens_type)
│   │   ├── lib/                # Supabase client, API client
│   │   ├── types/              # TypeScript definitions
│   │   ├── App.tsx             # Root Router & State Management
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── server/                     # Node.js + Express.js + TypeScript Backend
│   ├── src/
│   │   ├── controllers/        # upload.controller, ingest.controller, query.controller, files.controller
│   │   ├── middleware/         # auth.middleware (Strict Supabase JWT validation)
│   │   ├── routes/             # api.routes (Multer, Ingest, Query, Files)
│   │   ├── services/           # gemini.service (@google/genai), supabase.service, vector.service
│   │   ├── schemas.ts          # Zod request & response schemas
│   │   ├── types.ts
│   │   └── index.ts            # Express Server entry point
│   ├── tsconfig.json
│   └── package.json
│
├── database.sql                # Complete PostgreSQL schema (pgvector, tables, RLS, functions, buckets)
└── package.json                # Monorepo root runner
```

---

## 🚀 Getting Started

### 1. Database Setup in Supabase
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Copy the contents of [`database.sql`](file:///c:/Users/karth/older%20%282%29/project-2/database.sql) and click **Run**.
4. This enables `vector`, creates `profiles`, `files`, `document_chunks`, sets up RLS policies, and defines the `match_document_chunks` similarity search function.

### 2. Environment Variables

**Frontend (`client/.env`)**:
```env
VITE_SUPABASE_URL=https://xtwkdxoprwaobzmfxxnn.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Elr4C1guLTOvO3KLoevP_g_CIvCZeRN
VITE_API_URL=http://localhost:8000
```

**Backend (`server/.env`)**:
```env
PORT=8000
SUPABASE_URL=https://xtwkdxoprwaobzmfxxnn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_iFG0h55kAUcft5SaImRxYA_GpBQ2YQb
SUPABASE_JWKS_URL=https://xtwkdxoprwaobzmfxxnn.supabase.co/auth/v1/.well-known/jwks.json
GEMINI_API_KEY=your_google_gemini_api_key
STORAGE_BUCKET=unify-files
```

### 3. Running the Stack

To run the backend server (Port 8000):
```bash
npm run dev:server
```

To run the frontend client (Port 5173):
```bash
npm run dev:client
```

Open your browser at **`http://localhost:5173`**.

---

## 🧪 Testing the Complete Cross-Modal User Flow

1. **Authentication**:
   - Navigate to `http://localhost:5173`.
   - Sign in with your Supabase account or click **"Launch Instant Demo Workspace"** for instant 1-click access.

2. **Multimodal Ingestion (`/ingest`)**:
   - Go to the **Ingest** tab.
   - Click the **🌾 Agriculture Bundle** preset button (or drop your own MP3, PDF, and JPG files simultaneously).
   - Watch the pipeline upload to Supabase Storage, invoke Gemini multimodal parsing, and embed 768-D vectors into pgvector.

3. **Reasoning Studio (`/lens/Agriculture`)**:
   - Switch to the **Reasoning Studio** tab.
   - Click the suggested question: *"What is causing the leaf yellowing in Sector 4?"*.
   - Watch the reasoning synthesis synthesize evidence across:
     - 📷 Drone multispectral imagery in Sector 4 (NDVI drop).
     - 🧪 Soil laboratory report ($NO_3^-$-N at 8 ppm).
     - 🎙️ Farmer audio recording at timestamp 00:14.

4. **Verifiable Citations**:
   - Click any inline citation pill `[Drone Photo, Sector 4]` or `[Farmer Memo: 00:14]`.
   - The **SourceViewerModal** pops up, instantly seeking to the exact timestamp or highlighting the image sector!
