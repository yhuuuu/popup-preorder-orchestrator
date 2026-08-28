# Risk Log

| ID | Risk | Impact | Likelihood | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| R1 | Scope creep (adding frontend too early) | High | Medium | Keep remaining work limited to UI polish and interview preparation | Yuting | Mitigated |
| R2 | Webhook receiver instability | Medium | Medium | Retry behavior and webhook event logging are implemented and tested | Yuting | Mitigated |
| R3 | Inconsistent error responses | Medium | High | Unified error handler and validation are implemented and tested | Yuting | Mitigated |
| R4 | Documentation lag behind code | Medium | High | README, SQL, migration, and troubleshooting documentation are in place | Yuting | Mitigated |
| R5 | Time slippage due to debugging | Medium | Medium | Record blockers promptly and work on UI tasks while non-critical issues are fixed | Yuting | Open |
| R6 | Frontend blocked by CORS on local port 5175 | Medium | High | Fixed in `d2ea67b`: backend now loads `app/.env` via `--env-file-if-exists` and parses `FRONTEND_ORIGIN` as a comma-separated allowlist; verified from both 5173 and 5175 | Yuting | Mitigated |
| R7 | Server silently falls back to hardcoded defaults when `.env` is not loaded | High | Medium | `API_TOKEN`, `WEBHOOK_SECRET` and `FRONTEND_ORIGIN` still default to dev values in code, which masks a missing `.env`; make the backend fail loudly on missing required config | Yuting | Open |
| R8 | Dev API token exposed in the browser bundle and in git history | Medium | High | `VITE_API_TOKEN` is compiled into client JS and `web/.env` was previously committed; rotate the token and move auth server-side via a Vite proxy | Yuting | Open |
