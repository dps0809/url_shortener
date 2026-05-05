# Rate Limiting Feature Traceability

## Change Overview
Implemented a dual-layer rate limiting system for URL creation:
1.  **IP-Based Rate Limiting (Hourly):** 
    *   **Goal:** Prevent automated abuse from a single source.
    *   **Limit:** 10 shortens per hour per IP.
    *   **Implementation:** Next.js Route Handlers using Redis for distributed state management.
    *   **Files affected:**
        *   `app/api/public/shorten/route.ts` (Public API)
        *   `app/api/urls/route.ts` (Authenticated API)
2.  **User-Based Rate Limiting (Daily):**
    *   **Goal:** Enforce fair usage quotas per account.
    *   **Limit:** 50 shortens per 24-hour window (default).
    *   **Implementation:** Backend logic using PostgreSQL for persistent counters.
    *   **Files affected:**
        *   `backend/src/utils/queries/usage.ts`

## Technical Details
- **Redis Keys:** `ratelimit:auth:shorten:{ip}` and `ratelimit:public:shorten:{ip}`.
- **Expiration:** 3600 seconds (1 hour).
- **Error Response:** `429 Too Many Requests`.

## Traceability Date
Implemented on: April 8, 2026
Reason: USER requirement for single IP limitation to 10 per hour.
