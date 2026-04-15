import { describe, expect, it } from 'vitest'
import { buildContentSecurityPolicy } from '../securityHeaders.server'

describe('buildContentSecurityPolicy', () => {
  it('production omits unsafe-eval and adds hardening directives', () => {
    const csp = buildContentSecurityPolicy(true)
    expect(csp).not.toContain("'unsafe-eval'")
    expect(csp).toContain('https://unpkg.com')
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain('upgrade-insecure-requests')
    expect(csp).toContain("worker-src 'self' blob:")
  })

  it('development keeps unsafe-eval and localhost connect sources', () => {
    const csp = buildContentSecurityPolicy(false)
    expect(csp).toContain("'unsafe-eval'")
    expect(csp).toContain('ws://localhost:*')
    expect(csp).toContain('http://127.0.0.1:*')
    expect(csp).not.toContain('upgrade-insecure-requests')
    expect(csp).not.toContain("object-src 'none'")
  })
})
