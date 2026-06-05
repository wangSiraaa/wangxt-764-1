# Trae Preflight

This folder is prepared for `wangxt-764-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18064
- API_PORT: 19064
- WEB_PORT: 20064
- DB_PORT: 21064
- REDIS_PORT: 22064

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
