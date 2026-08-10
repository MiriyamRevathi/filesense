# FileSense - Enterprise Local File Organizer & Cryptographic SHA-256 Duplicate Engine

FileSense is a complete, full-stack privacy-first application for smart local file organization, cryptographic SHA-256 duplicate detection, real-time storage telemetry, and AI-powered file catalog enrichment.

---

## Architecture Overview

FileSense is designed with a multi-tiered architecture featuring:
1. **Frontend Presentation & Workspace (React 19 + TypeScript + Tailwind CSS):**
   - Interactive drag-and-drop file explorer with category filters (Images, Documents, Audio, Video, Code, Archives, Other).
   - Duplicate Lab with SHA-256 group inspection, side-by-side comparison, and automated resolution strategies (*Keep Oldest Original*, *Keep Newest Copy*, *Keep Cleanest Name*).
   - Real-time Storage Insights with disk allocation charts, size distribution histograms, and storage health score telemetry.
   - Offline-capable local IndexedDB persistence with seamless backend synchronization.
2. **Backend Application Server (Node.js + Express + TypeScript):**
   - REST API layer providing endpoints for file management, duplicate clustering, disk analytics, and system telemetry.
   - Domain-driven service architecture:
     - `FileService`: CRUD management, metadata inference, category classification, and batch deletions.
     - `HashService`: Streaming SHA-256 digest calculation and two-phase quick hashing for large assets.
     - `DuplicateEngineService`: Cryptographic duplicate grouping, wasted byte calculation, and retention policy resolution.
     - `StorageAnalyticsService`: Quota calculation, category breakdown distributions, and storage health scoring.
     - `AiService`: Google Gen AI SDK (`@google/genai`) integration with Gemini models for semantic tagging, document summarization, and storage audit recommendations.
     - `FileRepository`: Atomic file catalog persistence with thread-safe disk writing.
3. **Containerization & Deployment:**
   - Multi-stage `Dockerfile` and `docker-compose.yml` for zero-configuration container execution.

---

## Getting Started

### Prerequisites

- Node.js (version 20 or later recommended)
- npm (version 9 or later)

### Installation

Install all required production and development dependencies:

```bash
npm install
```

### Building the Application

Build both the client bundle (Vite) and the server bundle (esbuild):

```bash
npm run build
```

This compiles client assets into `dist/` and creates the standalone production server bundle at `dist/server.js`.

---

## Running the Application

### 1. Production Mode (Standard Runnable App)

To start the production server:

```bash
npm start
```

The application will start on `http://localhost:3000`.

### 2. Development Mode

To start the client development server with hot-module replacement (HMR):

```bash
npm run dev
```

To run the standalone server in development mode using `tsx`:

```bash
npm run server
```

### 3. Docker Deployment

To launch the complete application inside a Docker container:

```bash
docker compose up -d
```

---

## API Endpoints Reference

The backend exposes a comprehensive RESTful API under `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/system/health` | Health check diagnostics and memory telemetry |
| `GET` | `/api/system/info` | Platform information and system capabilities |
| `GET` | `/api/files` | Query files with filtering, search, and sorting |
| `POST` | `/api/files` | Create a new file record with metadata |
| `GET` | `/api/files/:id` | Retrieve metadata for a specific file |
| `PATCH` | `/api/files/:id/category` | Update file category classification |
| `PATCH` | `/api/files/:id/tags` | Update taxonomy tags |
| `DELETE` | `/api/files/:id` | Delete a single file |
| `DELETE` | `/api/files/batch` | Batch delete multiple files by ID list |
| `POST` | `/api/files/seed` | Seed default sample file catalog |
| `GET` | `/api/duplicates/scan` | Trigger full SHA-256 duplicate scan |
| `GET` | `/api/duplicates/groups` | Retrieve duplicate clusters |
| `POST` | `/api/duplicates/resolve` | Execute automated duplicate resolution strategy |
| `GET` | `/api/analytics/stats` | Comprehensive storage stats, health score, and buckets |
| `GET` | `/api/analytics/categories` | Storage usage breakdown by category |
| `GET` | `/api/analytics/sizes` | Size distribution buckets |
| `POST` | `/api/ai/analyze/:id` | AI semantic tagging and summary via Gemini |
| `GET` | `/api/ai/audit` | Holistic catalog audit and storage optimization advice |
| `POST` | `/api/ai/batch-tag` | Batch generate AI tags for untagged files |

---

## Testing & Quality Verification

Run the automated test suite across all client components and backend services:

```bash
npm test
```

Run TypeScript compilation verification:

```bash
npm run lint
```

---

## Technology Stack

- **Backend:** Node.js, Express, TypeScript, `@google/genai` (Google Gen AI SDK), `crypto`
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React
- **Client Storage:** IndexedDB via `idb`
- **Build Tools:** Vite, esbuild
- **Testing:** Vitest, React Testing Library, fake-indexeddb
- **DevOps:** Docker, Docker Compose
