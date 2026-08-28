# Decision Log

| Date       | Decision                                                       | Reason                                                                 | Trade-off                                |
| ---------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| 2026-08-03 | Use pop-up pre-order theme instead of inventory-heavy commerce | Matches real vendor workflow and user insight; better interview story  | Less focus on inventory APIs             |
| 2026-08-03 | Use TypeScript + Express                                       | Aligns with existing React/TS background and tech-company expectations | Slightly more setup than plain JS        |
| 2026-08-03 | Prioritize API + webhook before frontend                       | Fastest path to implementation-role proof points                       | UI demo delayed                          |
| 2026-08-03 | Keep MVP webhook retry to max 3 attempts                       | Simple, realistic reliability behavior                                 | Not full production-grade retry strategy |
| 2026-08-28 | Keep CORS restricted to configured frontend origins            | Protects the API from arbitrary browser origins while supporting local development | Local frontend ports must be listed in `FRONTEND_ORIGIN` |
| 2026-08-28 | Support comma-separated CORS origins                            | Allows Vite to use either local development port 5173 or 5175         | Requires parsing and validating the configuration as an allowlist |
| 2026-08-28 | Load `app/.env` with node's `--env-file-if-exists` instead of adding `dotenv` | The API previously never read `.env`, so `FRONTEND_ORIGIN` was ignored and silently fell back to the hardcoded `http://localhost:5173`; uses the built-in runtime flag rather than a new dependency | Env loading now lives in the npm scripts, so any new way of starting the server must pass the same flag |
| 2026-08-28 | Stop tracking `web/.env` in git                                 | It held `VITE_API_TOKEN` and was committed, unlike the already-ignored `app/.env` | The old value stays in git history, so the dev token should be rotated rather than assumed private |
