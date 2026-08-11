# Decision Log

| Date       | Decision                                                       | Reason                                                                 | Trade-off                                |
| ---------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| 2026-08-03 | Use pop-up pre-order theme instead of inventory-heavy commerce | Matches real vendor workflow and user insight; better interview story  | Less focus on inventory APIs             |
| 2026-08-03 | Use TypeScript + Express                                       | Aligns with existing React/TS background and tech-company expectations | Slightly more setup than plain JS        |
| 2026-08-03 | Prioritize API + webhook before frontend                       | Fastest path to implementation-role proof points                       | UI demo delayed                          |
| 2026-08-03 | Keep MVP webhook retry to max 3 attempts                       | Simple, realistic reliability behavior                                 | Not full production-grade retry strategy |
