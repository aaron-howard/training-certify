# Load test baselines

Baseline results for `perf/smoke-api.k6.js`.

## How to run

```bash
# Install k6: https://grafana.com/docs/k6/open-source/set-up/install-k6/
k6 run -e BASE_URL=https://YOUR_STAGING_URL -e VUS=3 -e DURATION=30s perf/smoke-api.k6.js
```

Or via GitHub Actions: **Actions → Load test → Run workflow** (requires `STAGING_BASE_URL` repository variable).

## How to interpret

| Metric              | Target (smoke)      | Notes                                      |
| ------------------- | ------------------- | ------------------------------------------ |
| `http_req_failed`   | `< 5%`              | Failures include 5xx and connection errors |
| `http_req_duration` | `p95 < 2000ms`      | Cold starts on Vercel may spike            |
| Checks              | `ready` returns 200 | Primary availability signal                |

## Recorded baselines

Fill in after the first successful staging run:

| Date      | Environment | VUs | Duration | p95 (ms) | Fail rate | Notes                              |
| --------- | ----------- | --- | -------- | -------- | --------- | ---------------------------------- |
| _pending_ | staging     | 3   | 30s      | —        | —         | Run once `STAGING_BASE_URL` is set |

Do not treat this smoke script as a capacity test. Increase VUs only against a dedicated staging DB and after raising `/api/health` rate limits if needed.
