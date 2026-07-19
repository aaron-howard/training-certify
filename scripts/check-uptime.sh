#!/usr/bin/env bash
# Probe /ready and /api/health for a deployed Training Certify instance.
# Usage: BASE_URL=https://example.vercel.app ./scripts/check-uptime.sh
# Optional: RETRIES=5 RETRY_SLEEP=5

set -euo pipefail

BASE_URL="${BASE_URL:-}"
RETRIES="${RETRIES:-5}"
RETRY_SLEEP="${RETRY_SLEEP:-5}"

if [ -z "${BASE_URL}" ]; then
  echo "::error::BASE_URL is required (e.g. https://staging.example.com)"
  exit 1
fi

# Strip trailing slash
BASE_URL="${BASE_URL%/}"

probe() {
  local path="$1"
  local expect_field="$2"
  local expect_value="$3"
  local url="${BASE_URL}${path}"
  local attempt=1
  local body=""
  local code=""

  while [ "${attempt}" -le "${RETRIES}" ]; do
    echo "Probing ${url} (attempt ${attempt}/${RETRIES})..."
    body="$(mktemp)"
    code="$(curl -sS -o "${body}" -w "%{http_code}" --max-time 30 "${url}" || echo "000")"
    if [ "${code}" = "200" ]; then
      if command -v jq >/dev/null 2>&1; then
        local actual
        actual="$(jq -r "${expect_field}" <"${body}")"
        if [ "${actual}" = "${expect_value}" ]; then
          echo "OK ${path}: HTTP ${code}, ${expect_field}=${actual}"
          rm -f "${body}"
          return 0
        fi
        echo "Unexpected body for ${path}: wanted ${expect_field}=${expect_value}, got ${actual}"
        cat "${body}" || true
      else
        # Fallback without jq: require 200 only
        echo "OK ${path}: HTTP ${code} (jq not installed; body check skipped)"
        rm -f "${body}"
        return 0
      fi
    else
      echo "HTTP ${code} from ${url}"
      cat "${body}" || true
    fi
    rm -f "${body}"
    if [ "${attempt}" -lt "${RETRIES}" ]; then
      sleep "${RETRY_SLEEP}"
    fi
    attempt=$((attempt + 1))
  done

  echo "::error::Probe failed for ${path} after ${RETRIES} attempts"
  return 1
}

probe "/ready" ".ready" "true"
probe "/api/health" ".status" "healthy"
echo "All uptime probes passed for ${BASE_URL}"
