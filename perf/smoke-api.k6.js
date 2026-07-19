/**
 * Lightweight API smoke / baseline load script for Training Certify.
 *
 * Usage:
 *   k6 run -e BASE_URL=https://your-staging.vercel.app perf/smoke-api.k6.js
 *
 * Notes:
 * - Prefer /ready over /api/health for volume (health is rate-limited at 10/min/IP).
 * - Keep VUs modest against shared staging DBs.
 */

import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 3),
      duration: __ENV.DURATION || '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
}

export default function () {
  const ready = http.get(`${BASE_URL}/ready`)
  check(ready, {
    'ready status 200': (r) => r.status === 200,
    'ready body ready=true': (r) => {
      try {
        return r.json('ready') === true
      } catch {
        return false
      }
    },
  })

  const home = http.get(`${BASE_URL}/`)
  check(home, {
    'home status ok': (r) => r.status >= 200 && r.status < 500,
  })

  const signIn = http.get(`${BASE_URL}/sign-in`)
  check(signIn, {
    'sign-in status ok': (r) => r.status >= 200 && r.status < 500,
  })

  // Sparse health probe (avoid rate-limit storms)
  if (__ITER % 10 === 0) {
    const health = http.get(`${BASE_URL}/api/health`)
    check(health, {
      'health status 200 or 429': (r) => r.status === 200 || r.status === 429,
    })
  }

  sleep(1)
}
