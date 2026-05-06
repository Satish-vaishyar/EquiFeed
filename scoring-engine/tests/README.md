# Demo API Checks

Run this after the server is running:

```bash
.venv\Scripts\python.exe tests\demo_queries.py --base-url http://127.0.0.1:8081
```

The script checks:

- `GET /health`
- `GET /`
- `POST /score` with a stronger AI/fairness post
- `POST /score` with a weaker demo post

It validates the main response fields, score ranges, rank tier, boost flag, and feedback report behavior.
