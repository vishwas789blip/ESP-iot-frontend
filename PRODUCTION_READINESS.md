# ESP32 IoT Frontend – Production Readiness

This package is the frontend only. It is hardened to work with the existing REST + WebSocket backend without changing the backend API contract.

## Changes made

- Centralized runtime configuration in `src/config/env.ts`.
- Added `VITE_WS_URL` support and production `wss://` derivation.
- Hardened the API client:
  - request timeout
  - caller abort support
  - consistent JSON/error parsing
  - proper `204` handling
  - preserved backend error messages
  - automatic logout on HTTP 401
- Reworked the AI Assistant page to use the shared API client instead of direct `fetch`/localStorage access.
- AI Assistant now displays the actual backend error message instead of the generic “could not generate a response”.
- Added a global React `ErrorBoundary`.
- Improved realtime telemetry handling so generic readings can be retained, not only PIR/buzzer.
- Removed nested React state updates from telemetry processing.
- Added reconnect jitter and MQTT state reset after WebSocket disconnect.
- Improved data-fetch cancellation so overlapping refetches do not race.
- Added typed Vite environment variables.
- Added `.gitignore`.

## Environment

Development:

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
VITE_APP_VERSION=dev
```

Production example:

```env
VITE_API_URL=https://api.example.com/api
VITE_WS_URL=wss://api.example.com
VITE_APP_VERSION=1.0.0
```

Never put API keys, JWT secrets, MongoDB credentials, or Gemini/Anthropic keys in `VITE_*` variables. Vite variables are shipped to the browser.

## Backend requirements that remain

The uploaded project contains only the frontend, so these backend items must still be handled in the backend repository:

1. Keep the `/api/ai/chat` endpoint working.
2. Configure the Gemini model/API key on the server. The API key must never be placed in the frontend.
3. Make sure the WebSocket endpoint accepts the same JWT format used by the frontend.
4. Keep the MQTT automation publishing and device telemetry flow unchanged.
5. For stronger production security, move JWT authentication from browser localStorage to an HttpOnly, Secure, SameSite cookie and update the backend authentication flow accordingly.

## Verification

Run:

```bash
npm ci
npm run check
npm run build
npm run preview
```

The build could not be fully executed in the review environment because the uploaded dependency tree was incomplete and package installation could not finish due unavailable package-cache/network access. The source changes were therefore reviewed statically, but a final CI build should be run in your development/CI environment.
