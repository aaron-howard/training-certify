import { afterEach, describe, expect, it } from 'vitest'
import { requireInternalOpsAuth } from '../internalOpsAuth.server'

describe('internalOpsAuth.server.ts', () => {
  afterEach(() => {
    delete process.env.INTERNAL_OPS_TOKEN
  })

  it('allows all requests when INTERNAL_OPS_TOKEN is unset', () => {
    delete process.env.INTERNAL_OPS_TOKEN
    const req = new Request('http://localhost/metrics')
    expect(requireInternalOpsAuth(req)).toBeNull()
  })

  it('returns 401 when token is set but header missing', () => {
    process.env.INTERNAL_OPS_TOKEN = 'x'.repeat(16)
    const req = new Request('http://localhost/metrics')
    const res = requireInternalOpsAuth(req)
    expect(res).not.toBeNull()
    expect(res!.status).toBe(401)
  })

  it('allows Authorization Bearer token', () => {
    const secret = 'y'.repeat(16)
    process.env.INTERNAL_OPS_TOKEN = secret
    const req = new Request('http://localhost/metrics', {
      headers: { Authorization: `Bearer ${secret}` },
    })
    expect(requireInternalOpsAuth(req)).toBeNull()
  })

  it('allows X-Internal-Ops-Token header', () => {
    const secret = 'z'.repeat(16)
    process.env.INTERNAL_OPS_TOKEN = secret
    const req = new Request('http://localhost/metrics', {
      headers: { 'X-Internal-Ops-Token': secret },
    })
    expect(requireInternalOpsAuth(req)).toBeNull()
  })

  it('rejects wrong bearer token', () => {
    process.env.INTERNAL_OPS_TOKEN = 'a'.repeat(16)
    const req = new Request('http://localhost/metrics', {
      headers: { Authorization: `Bearer ${'b'.repeat(16)}` },
    })
    expect(requireInternalOpsAuth(req)?.status).toBe(401)
  })
})
