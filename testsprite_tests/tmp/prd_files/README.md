# URL Shortener — Production-Grade Backend

A security-first, high-performance URL shortener built with **Next.js 16**, **PostgreSQL**, **Redis Stack**, and **BullMQ**. Uses a hybrid **scan-first fan-out** architecture: every URL is scanned for malware before database insertion, then non-blocking tasks (QR generation, analytics, audit logging) are fanned out to independent background workers.

---

## Tech Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Next.js | 16.2.0 | API routes (App Router), SSR |
| Runtime | Node.js | 20+ | Server runtime |
| Language | TypeScript | 5.x | Type safety |
| Database | PostgreSQL | 15+ | Primary data store (10 tables) |
| Cache/Queue | Redis Stack | 7.x | Caching, rate limiting, BullMQ backend |
| Job Queue | BullMQ | 5.71+ | 6 queues, 7 workers |
| Auth | JWT + bcryptjs | — | Session-based auth with hashed passwords |
| Security | VirusTotal + Google Safe Browsing | — | URL malware scanning |
| QR Codes | qrcode + ImageKit | — | QR generation and CDN hosting |
| User Agent | ua-parser-js | 2.x | Device detection for analytics |
| Short Codes | nanoid | 3.x | Collision-resistant ID generation |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                       │
│  app/api/auth/*    app/api/urls/*    app/api/admin/*    app/[code]│
│       │                  │                │                │     │
│       └──────────────────┼────────────────┘                │     │
│                          ▼                                 ▼     │
│              ┌─────────────────────┐          ┌────────────────┐│
│              │  Service Layer      │          │ Redirect Engine ││
│              │  (business logic)   │          │ Redis→DB→Cache  ││
│              └────────┬────────────┘          └───────┬────────┘│
│                       │                               │         │
│         ┌─────────────┼──────────────┐                │         │
│         ▼             ▼              ▼                ▼         │
│  ┌───────────┐ ┌───────────┐ ┌────────────┐ ┌──────────────┐   │
│  │ PostgreSQL│ │   Redis   │ │   BullMQ   │ │ Click Logger │   │
│  │ 10 tables │ │ Cache/RL  │ │ 6Q / 7W    │ │  (async)     │   │
│  └───────────┘ └───────────┘ └────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Two Code Layers

The project has **two sets of API routes** that coexist:

1. **`app/api/*`** — Production routes used by the frontend. These use `PoolClient`-based queries from `utils/queries/*.ts`, proper JWT auth, and the scan-first pipeline.
2. **`backend/src/app/api/*`** — Legacy/internal routes that delegate to handler functions in `backend/src/routes/*.ts`. These use the model-layer pattern from `backend/src/models/*.ts`.

Both layers share the same database, Redis instance, and BullMQ workers.

---

## Environment Variables

File: `.env.local` (project root)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/url_shortener

# Redis
REDIS_URL=redis://localhost:6379

# Security APIs
VIRUSTOTAL_API_KEY=your_virustotal_api_key
GOOGLE_SAFE_BROWSING_API_KEY=your_google_sb_key

# Auth
JWT_SECRET=your_super_secret_jwt_key_change_this

# ImageKit (QR code CDN) — optional, falls back to data URI
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Critical notes:**
- `VIRUSTOTAL_API_KEY` — code reads this exact name in `backend/src/utils/safety.ts`
- `JWT_SECRET` — used by `backend/src/utils/auth.ts` for signing/verifying tokens
- If neither security API key is set, URLs are marked `safe` by default (dev mode)
- If ImageKit keys are missing, QR codes fall back to base64 data URIs

---

## Database Schema (10 Tables)

Migration file: `backend/src/utils/migrate.ts`  
Run with: `npx tsx --env-file=.env.local backend/src/utils/migrate.ts`

### Table 1: `users`
```sql
user_id      BIGSERIAL PRIMARY KEY
email        VARCHAR(255) UNIQUE NOT NULL
password_h   TEXT NOT NULL              -- bcrypt hash (column name is password_h, NOT password_hash)
role         VARCHAR(10) DEFAULT 'user' -- 'user' or 'admin'
is_active    BOOLEAN DEFAULT true
created_at   TIMESTAMP DEFAULT NOW()
```

### Table 2: `urls`
```sql
url_id       BIGSERIAL PRIMARY KEY     -- PK is url_id, NOT id
short_code   VARCHAR(10) UNIQUE NOT NULL
long_url     TEXT NOT NULL
user_id      BIGINT REFERENCES users(user_id)
created_at   TIMESTAMP DEFAULT NOW()
expiry_date  TIMESTAMP                 -- nullable, auto-expire
max_clicks   INTEGER                   -- nullable, auto-expire after N clicks
click_count  INTEGER DEFAULT 0
is_deleted   BOOLEAN DEFAULT false     -- soft delete
deleted_at   TIMESTAMP
status       VARCHAR(20) DEFAULT 'active' -- active|disabled|expired|malicious|dead
-- INDEXES: short_code, user_id, created_at
```

### Table 3: `click_logs`
```sql
click_id     BIGSERIAL PRIMARY KEY
url_id       BIGINT REFERENCES urls(url_id)
clicked_at   TIMESTAMP DEFAULT NOW()
ip_address   VARCHAR(45)
country      VARCHAR(100)              -- geo lookup (placeholder, currently null)
device       VARCHAR(20)               -- 'desktop' or 'mobile' (from ua-parser-js)
referrer     TEXT
-- INDEXES: url_id, clicked_at, country
```

### Table 4: `link_health`
```sql
health_id        BIGSERIAL PRIMARY KEY
url_id           BIGINT UNIQUE REFERENCES urls(url_id)
last_status_code INTEGER
failure_count    INTEGER DEFAULT 0      -- marks dead after 3 consecutive failures
last_checked_at  TIMESTAMP
is_dead          BOOLEAN DEFAULT false
```

### Table 5: `safety_scan`
```sql
scan_id       BIGSERIAL PRIMARY KEY
url_id        BIGINT REFERENCES urls(url_id)
scan_result   VARCHAR(20) NOT NULL     -- 'safe', 'phishing', 'malware'
scan_provider VARCHAR(100) NOT NULL    -- 'virustotal', 'google_safe_browsing', etc.
scanned_at    TIMESTAMP DEFAULT NOW()
```

### Table 6: `qr_codes`
```sql
qr_id         BIGSERIAL PRIMARY KEY
url_id        BIGINT UNIQUE REFERENCES urls(url_id)
qr_image_url  TEXT NOT NULL            -- ImageKit CDN URL or data URI
generated_at  TIMESTAMP DEFAULT NOW()
```

### Table 7: `user_sessions`
```sql
session_id  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     BIGINT REFERENCES users(user_id)
created_at  TIMESTAMP DEFAULT NOW()
expires_at  TIMESTAMP NOT NULL         -- 7 days from creation
ip_address  VARCHAR(45)
```

### Table 8: `api_usage`
```sql
id             BIGSERIAL PRIMARY KEY
user_id        BIGINT UNIQUE REFERENCES users(user_id)
request_count  INTEGER DEFAULT 0       -- resets after 24 hours
last_request   TIMESTAMP DEFAULT NOW()
```

### Table 9: `url_stats`
```sql
url_id         BIGINT UNIQUE REFERENCES urls(url_id)
daily_clicks   INTEGER DEFAULT 0
weekly_clicks  INTEGER DEFAULT 0
monthly_clicks INTEGER DEFAULT 0
last_updated   TIMESTAMP DEFAULT NOW()
```

### Table 10: `audit_logs`
```sql
id            BIGSERIAL PRIMARY KEY
admin_id      BIGINT REFERENCES users(user_id)
action        VARCHAR(100) NOT NULL    -- e.g. 'deleted_url', 'changed_status_to_disabled'
target_url_id BIGINT                   -- nullable
created_at    TIMESTAMP DEFAULT NOW()
```

---

## Redis Usage

**Connection:** `redis://localhost:6379` (configured in `REDIS_URL` env var)

**Singleton client:** `backend/src/utils/redis.ts` — uses `ioredis` with `maxRetriesPerRequest: null` (required by BullMQ).

| Key Pattern | Type | Purpose | TTL |
|-------------|------|---------|-----|
| `short:{shortCode}` | STRING | Cached long URL for redirect | 3600s (1hr) |
| `clicks:{shortCode}` | STRING (counter) | Real-time click count, synced to DB every 30min | ∞ |
| `ratelimit:redirect:{ip}` | STRING (counter) | 20 redirects/min per IP | 60s |
| `ratelimit:create:{userId}` | STRING (counter) | 50 URL creations/day per user | 86400s |
| `rate:{type}:user:{userId}` | STRING (counter) | Middleware-level rate limiter | varies |
| `lock:worker:{jobId}` | STRING | Distributed worker lock | 60s |
| `bull:*` | Various | BullMQ internal queue/job/event data | managed |

**Three separate Redis instances exist in the codebase** (each creates its own `ioredis` connection):
1. `backend/src/utils/redis.ts` — main singleton, used by queues/workers/route handlers
2. `backend/src/services/cache.service.ts` — dedicated cache connection
3. `backend/src/services/rateLimit.service.ts` — dedicated rate limit connection
4. `backend/src/services/metrics.service.ts` — dedicated metrics connection

All connect to the same Redis server at `localhost:6379`.

---

## Authentication System

**File:** `backend/src/utils/auth.ts`

1. **Password hashing:** `bcryptjs` with 12 salt rounds
2. **JWT signing:** `jsonwebtoken`, token contains `{ userId, sessionId, role }`, expires in 7 days
3. **Session validation:** Every protected request verifies JWT → looks up session in `user_sessions` table → checks expiry and user active status
4. **Two guard functions:**
   - `requireAuth(request)` — returns `AuthUser` or throws 401 Response
   - `requireAdmin(request)` — returns `AuthUser` with admin role or throws 403 Response

---

## Scan-First Fan-Out Pipeline

When `POST /api/urls` is called:

```
1. requireAuth()           → JWT validation + session check
2. checkAndIncrementUsage() → DB-based rate limit (100/day via api_usage table)
3. URL validation          → format check with new URL()
4. createShortUrl()        → enters the pipeline:
   │
   ├─ Step 1: SCAN (synchronous, blocking)
   │   └─ scanQueue.add('scan', { longUrl, userId, ... })
   │   └─ scanWorker processes → VirusTotal API → Google Safe Browsing API
   │   └─ If malicious → throws Error, URL creation REJECTED
   │   └─ If safe → returns { result: 'safe', provider: '...' }
   │
   ├─ Step 2: CREATE (synchronous, blocking)
   │   └─ Generate short code (nanoid, 6 chars, a-z0-9)
   │   └─ linkCreationQueue.add('create', { longUrl, shortCode, ... })
   │   └─ linkCreationWorker processes → INSERT INTO urls → RETURNING *
   │   └─ Returns UrlRecord to caller
   │
   └─ Step 3: FAN-OUT (asynchronous, non-blocking)
       ├─ qrQueue.add('generate', { urlId, shortCode })
       ├─ analyticsQueue.add('setup', { urlId, shortCode })
       └─ loggingQueue.add('log', { action: 'URL_CREATED', ... })
```

---

## BullMQ Queues & Workers

### 6 Queues

| Queue | File | Job Types | Retry |
|-------|------|-----------|-------|
| `scanQueue` | `queues/scan.queue.ts` | `scan` | 2x, fixed 2s |
| `linkCreationQueue` | `queues/linkCreation.queue.ts` | `create` | 3x, exponential 1s |
| `qrQueue` | `queues/qr.queue.ts` | `generate` | 3x, exponential 1s |
| `analyticsQueue` | `queues/analytics.queue.ts` | `click`, `setup` | 5x, exponential 2s |
| `loggingQueue` | `queues/logging.queue.ts` | `log` | 5x, exponential 1s |
| `maintenanceQueue` | `queues/maintenance.queue.ts` | `dead_link_scan`, `expiry_scan`, `click_sync`, `malware_scan` | 2x, fixed 5s |

### 7 Workers

| Worker | File | Queue | Concurrency | What it does |
|--------|------|-------|-------------|--------------|
| `scanWorker` | `workers/scan.worker.ts` | scanQueue | 10 | Calls VirusTotal + Google Safe Browsing. Blocks if malicious. |
| `malwareScanWorker` | `workers/scan.worker.ts` | maintenanceQueue | 5 | Manual re-scan of specific URLs (task=malware_scan) |
| `linkCreationWorker` | `workers/linkCreation.worker.ts` | linkCreationQueue | 10 | INSERT into urls table, then fan-out to QR/analytics/logging |
| `qrWorker` | `workers/qr.worker.ts` | qrQueue | 5 | Generates QR code PNG, uploads to ImageKit, stores URL |
| `analyticsWorker` | `workers/analytics.worker.ts` | analyticsQueue | 10 | Handles 'setup' (init url_stats) and 'click' (insert click_log) |
| `clickSyncWorker` | `workers/analytics.worker.ts` | maintenanceQueue | 1 | Flushes Redis click counters to DB (task=click_sync) |
| `deadLinkWorker` | `workers/deadLink.worker.ts` | maintenanceQueue | 1 | HTTP HEAD check on active URLs (task=dead_link_scan) |
| `expiryWorker` | `workers/expiry.worker.ts` | maintenanceQueue | 1 | Marks expired URLs, clears cache (task=expiry_scan) |
| `loggingWorker` | `workers/logging.worker.ts` | loggingQueue | 10 | Writes audit_logs entries |

### Scheduled Jobs (via `worker.service.ts`)

| Job | Interval | Description |
|-----|----------|-------------|
| `click_sync` | Every 30 min | Flush `clicks:*` Redis counters → `urls.click_count` in DB |
| `dead_link_scan` | Every 1 hour | HTTP HEAD check all active URLs |
| `expiry_scan` | Every 10 min | Mark expired links, clear Redis cache |

---

## API Endpoints Summary

### Auth (`app/api/auth/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | Create account (email, password) |
| POST | `/api/auth/login` | ❌ | Login, get JWT token |
| GET | `/api/auth/me` | 🔒 | Get current user info |
| POST | `/api/auth/logout` | 🔒 | Invalidate session |

### URLs (`app/api/urls/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/urls` | 🔒 | Create short URL (triggers scan pipeline) |
| GET | `/api/urls` | 🔒 | List user's URLs (paginated) |
| DELETE | `/api/urls/[id]` | 🔒 | Soft delete URL |

### Redirect (`app/[code]/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/[code]` | ❌ | 302 redirect to original URL |

### Stats (`app/api/stats/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/stats/[code]` | 🔒 | Full analytics (clicks, devices, countries, referrers, health) |

### Health (`app/api/health/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health/check` | ❌ | Cron: check health of all active URLs |

### Admin (`app/api/admin/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/urls` | 🔒admin | List all URLs with health/safety data |
| PATCH | `/api/admin/urls/[id]` | 🔒admin | Update status, soft delete, audit log |

### Legacy Backend Routes (`backend/src/app/api/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/urls/[id]/analytics` | Total clicks |
| GET | `/urls/[id]/status` | Link state |
| PATCH | `/urls/[id]/disable` | Disable link |
| PATCH | `/urls/[id]/enable` | Enable link |
| PATCH | `/urls/[id]/extend` | Extend expiry |
| GET | `/urls/[id]/qrcode` | Get QR code URL |
| GET | `/system/health` | DB + Redis health |
| GET | `/system/metrics` | System-wide metrics |
| GET | `/system/rate-limit` | Remaining quota |
| POST | `/internal/workers/deadlink-scan` | Trigger dead link scan |
| POST | `/internal/workers/sync-clicks` | Trigger click sync |
| POST | `/internal/workers/scan-malware` | Trigger malware scan |
| GET | `/internal/queues` | Queue status |

---

## File Structure (Every File Explained)

```
url_shortener/
├── .env.local                          # Environment variables
├── next.config.ts                      # Next.js config (externalize pg, ImageKit domains)
├── tsconfig.json                       # TypeScript config (paths: @/* → ./*)
├── package.json                        # Dependencies and scripts
├── API_ENDPOINTS.md                    # Detailed API reference with curl examples
│
├── app/                                # Next.js App Router (PRODUCTION routes)
│   ├── layout.tsx                      # Root layout
│   ├── globals.css                     # Global styles
│   ├── [code]/route.ts                 # GET /[code] — Redirect engine
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts       # POST — User registration
│       │   ├── login/route.ts          # POST — User login
│       │   ├── me/route.ts            # GET  — Current user info
│       │   └── logout/route.ts         # POST — Session invalidation
│       ├── urls/
│       │   ├── route.ts               # POST (create) + GET (list) URLs
│       │   └── [id]/route.ts          # DELETE — Soft delete URL
│       ├── stats/[code]/route.ts      # GET  — Full analytics dashboard
│       ├── health/check/route.ts      # GET  — Cron-based health checker
│       └── admin/urls/
│           ├── route.ts               # GET  — Admin list all URLs
│           └── [id]/route.ts          # PATCH — Admin update/delete URL
│
└── backend/src/
    ├── config/
    │   ├── env.ts                     # Exports { REDIS_URL, DATABASE_URL }
    │   ├── redis.config.ts            # Redis config constants, key prefixes, TTLs
    │   └── db.config.ts               # Database pool config constants
    │
    ├── utils/
    │   ├── db.ts                      # PostgreSQL pool singleton + query/transaction helpers
    │   ├── redis.ts                   # ioredis singleton + getCache/setCache/delCache/incrCounter/expireKey
    │   ├── auth.ts                    # hashPassword, comparePassword, signToken, verifyToken,
    │   │                              #   getSession, requireAuth, requireAdmin
    │   ├── safety.ts                  # scanUrl() — VirusTotal + Google Safe Browsing
    │   ├── shortCode.ts              # generateUniqueShortCode() — nanoid with collision check
    │   ├── qr.ts                     # generateQrCode() — qrcode lib + ImageKit upload
    │   ├── migrate.ts                # Database migration script (creates all 10 tables)
    │   ├── hash.ts                   # (empty stub)
    │   └── logger.ts                 # (empty stub)
    │   └── queries/                  # PoolClient-based SQL query functions
    │       ├── urls.ts               # createUrl, getUrlByShortCode, getUrlById, getUrlForRedirect,
    │       │                         #   listUrlsByUser, listAllUrls, incrementClickCount,
    │       │                         #   updateUrlStatus, softDeleteUrl, shortCodeExists,
    │       │                         #   getActiveUrlsForHealthCheck
    │       ├── users.ts              # createUser, getUserByEmail, getUserById, checkEmailExists,
    │       │                         #   deactivateUser, listUsers
    │       ├── sessions.ts           # createSession, getSessionWithUser, deleteSession,
    │       │                         #   deleteExpiredSessions
    │       ├── clicks.ts             # insertClick, getClicksByUrlId, getDailyBreakdown,
    │       │                         #   getDeviceBreakdown, getCountryBreakdown, getTopReferrers
    │       ├── stats.ts              # initUrlStats, getStatsByUrlId, updateUrlStats
    │       ├── health.ts             # upsertLinkHealth, recordHealthFailure, getHealthByUrlId,
    │       │                         #   initLinkHealth
    │       ├── qr.ts                 # insertQrCode, getQrByUrlId, updateQrImageUrl
    │       ├── audit.ts              # insertAuditLog, getAuditLogs, getAuditLogsByAdmin
    │       ├── usage.ts              # checkAndIncrementUsage (100 req/day), getUsage
    │       └── safety.ts             # insertSafetyScan, getLatestScan, getScansByUrlId
    │
    ├── models/                       # Legacy DAL (standalone query functions, no PoolClient param)
    │   ├── url.model.ts              # UrlRecord CRUD (uses url_id as PK)
    │   ├── user.model.ts             # UserRecord CRUD (uses user_id as PK, password_h column)
    │   ├── click.model.ts            # ClickLogRecord — insertClickLog, analytics queries
    │   ├── qr.model.ts              # QRCodeRecord — createQRCode, getQRCodeByUrlId
    │   ├── safetyScan.model.ts       # SafetyScanRecord — insertSafetyScanResult, markUrlAsMalicious
    │   ├── linkHealth.model.ts       # LinkHealthRecord — health check, markUrlDead
    │   ├── cache.model.ts            # Redis cache operations (getCachedUrl, cacheUrl, rate limits)
    │   ├── metrics.model.ts          # getTotalUrlsCount, getTotalClicksCount, getTotalUsersCount
    │   ├── admin.model.ts            # getAllUsers, getAllUrls, insertAuditLog, getAuditLogs
    │   └── analytics.model.ts        # (empty stub)
    │
    ├── services/                     # Business logic layer
    │   ├── url.service.ts            # createShortUrl (orchestrates scan→create→fanout pipeline)
    │   ├── redirect.service.ts       # resolveShortUrl (cache→DB→validate→analytics)
    │   ├── queue.service.ts          # Central hub: re-exports all queues + enqueue helper functions
    │   ├── worker.service.ts         # startAllWorkers() + schedules repeating maintenance jobs
    │   ├── analytics.service.ts      # getDailyAnalytics, getCountryAnalytics, getDeviceAnalytics
    │   │                             #   (queries click_logs table, NOT analytics table)
    │   ├── scan.service.ts           # scanUrl, storeScanResult, markMaliciousUrl, banUserForPhishing
    │   ├── cache.service.ts          # getUrlCache, setUrlCache, deleteUrlCache (own Redis instance)
    │   ├── rateLimit.service.ts      # checkRedirectLimit, checkCreationLimit, getRemainingQuota
    │   ├── qr.service.ts             # generateQRCode, storeQRCode, getQRCode, deleteQRCode
    │   ├── metrics.service.ts        # getSystemMetrics (DB stats + Redis memory info)
    │   ├── linkHealth.service.ts     # checkLinkHealth, markDeadLink, updateHealthStatus
    │   ├── expiry.service.ts         # checkExpiredUrls, markExpiredUrl, clearExpiredCache
    │   ├── admin.service.ts          # getAllUsers/Urls, blockUser/Url, getAuditLogs
    │   ├── auth.service.ts           # AuthService.enforceRateLimit (service-layer rate limiter)
    │   └── user.service.ts           # registerUser, loginUser, getUserByEmail, disableUser
    │
    ├── queues/                       # BullMQ Queue definitions (each exports Queue + types)
    │   ├── scan.queue.ts             # scanQueue + QueueEvents + ScanQueueJobData
    │   ├── linkCreation.queue.ts     # linkCreationQueue + QueueEvents + LinkCreationQueueJobData
    │   ├── qr.queue.ts              # qrQueue + QRQueueJobData
    │   ├── analytics.queue.ts        # analyticsQueue + AnalyticsJobData (setup | click)
    │   ├── maintenance.queue.ts      # maintenanceQueue + QueueEvents + MaintenanceQueueJobData
    │   └── logging.queue.ts          # loggingQueue + LoggingQueueJobData
    │
    ├── workers/                      # BullMQ Worker processors
    │   ├── scan.worker.ts            # scanWorker (scanQueue) + malwareScanWorker (maintenanceQueue)
    │   ├── linkCreation.worker.ts    # linkCreationWorker — DB insert + fan-out
    │   ├── qr.worker.ts             # qrWorker — QR generation
    │   ├── analytics.worker.ts       # analyticsWorker (analyticsQueue) + clickSyncWorker (maintenance)
    │   ├── logging.worker.ts         # loggingWorker — audit log entries
    │   ├── deadLink.worker.ts        # deadLinkWorker — HTTP HEAD health checks
    │   └── expiry.worker.ts          # expiryWorker — mark expired URLs + clear cache
    │
    ├── routes/                       # Handler functions (used by legacy backend/src/app/api/)
    │   ├── url.routes.ts             # Handlers 1-6: CRUD + redirect
    │   ├── analytics.routes.ts       # Handlers 7-9: clicks, daily, country, device analytics
    │   ├── lifecycle.routes.ts       # Handlers 10-13: status, disable, enable, extend
    │   ├── qrcode.routes.ts          # Handler 14: QR code retrieval
    │   ├── system.routes.ts          # Handlers 15-17: health, metrics, rate-limit
    │   └── internal.routes.ts        # Handlers 18-21: worker triggers, queue status
    │
    ├── middleware/
    │   ├── rateLimit.middleware.ts    # checkRateLimit() — Redis-based rate limiter
    │   ├── auth.middleware.ts        # (empty stub)
    │   └── error.middleware.ts       # (empty stub)
    │
    ├── validators/
    │   ├── auth.validator.ts         # (empty stub)
    │   └── url.validator.ts          # (empty stub)
    │
    └── constants/
        ├── messages.ts               # (empty stub)
        └── statusCodes.ts            # (empty stub)
```

---

## Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (port 5432) and Redis Stack (port 6379)

# 3. Run database migration
npx tsx --env-file=.env.local backend/src/utils/migrate.ts

# 4. Start development server
npm run dev

# 5. App runs at http://localhost:3000
```

### Scripts
```json
"dev": "next dev"         // Development server
"build": "next build"     // Production build
"start": "next start"     // Production server
"lint": "eslint"          // Linting
"db:migrate": "npx tsx --env-file=.env.local lib/migrate.ts"
```

---

## Key Design Decisions

1. **Scan-first pipeline**: URLs are BLOCKED from creation if VirusTotal or Google Safe Browsing flags them. This happens synchronously via BullMQ `waitUntilFinished`.
2. **Fan-out pattern**: After URL creation, QR/analytics/logging jobs are enqueued but NOT awaited — the API responds immediately.
3. **Dual rate limiting**: DB-based (`api_usage` table, 100/day) for creation AND Redis-based (`ratelimit:*` keys) for redirects.
4. **Soft deletes**: URLs are never physically deleted — `is_deleted=true` + `deleted_at` timestamp.
5. **Click counter sync**: Real-time clicks go to Redis (`clicks:{code}`), periodically flushed to `urls.click_count` by the clickSyncWorker every 30 minutes.
6. **Health monitoring**: Background worker performs HTTP HEAD requests on all active URLs. After 3 consecutive failures, URL status is set to `dead`.
7. **Session-based JWT**: Tokens contain sessionId which is validated against `user_sessions` table on every request — allows server-side session invalidation.

---

## Important Column Name Conventions

| Table | Primary Key Column | Notes |
|-------|-------------------|-------|
| users | `user_id` | NOT `id` |
| urls | `url_id` | NOT `id` |
| click_logs | `click_id` | — |
| link_health | `health_id` | — |
| safety_scan | `scan_id` | — |
| qr_codes | `qr_id` | — |
| user_sessions | `session_id` (UUID) | — |
| api_usage | `id` | — |
| audit_logs | `id` | — |

- **Password column** in users table is `password_h`, NOT `password_hash`
- **Click logs table** is `click_logs`, NOT `analytics`
- **URL status values**: `active`, `disabled`, `expired`, `malicious`, `dead`
