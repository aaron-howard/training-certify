import { beforeEach, describe, expect, it, vi } from 'vitest'
import { factories } from '../../test/factories'
import { mockAuthForRole, setupTestMocks } from '../../api/__tests__/helpers'

vi.mock('@clerk/tanstack-react-start/server', () => ({
  auth: vi.fn(),
  clerkClient: {
    users: {
      getUser: vi.fn(),
    },
  },
}))
vi.mock('../../db/db.server', async () => {
  const actual = await vi.importActual('../../db/db.server')
  return {
    ...actual,
    getDb: vi.fn(),
    getDbOrThrow: vi.fn(),
  }
})
vi.mock('../auth.server', async () => {
  const actual = await vi.importActual('../auth.server')
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(),
    requireRole: vi.fn(),
    getVerifiedAuth: vi.fn(),
  }
})
vi.mock('../rateLimit.server', () => ({
  requireRateLimit: vi.fn(),
  RateLimitPresets: {
    READ: { windowMs: 60000, maxRequests: 100 },
    MUTATION: { windowMs: 60000, maxRequests: 30 },
    AUTH: { windowMs: 60000, maxRequests: 5 },
    ADMIN: { windowMs: 60000, maxRequests: 50 },
  },
}))
vi.mock('../csrf.server', () => ({
  requireCSRFToken: vi.fn(),
  getCSRFTokenFromRequest: vi.fn(() => 'test-token'),
}))
vi.mock('../certificationProofStorage.server', () => ({
  uploadCertificationProof: vi.fn().mockResolvedValue({
    fileName: 'certificate.pdf',
    fileUrl: 'https://example.test/certification-proofs/cert/certificate.pdf',
  }),
}))

describe('handlePostCertificationProof', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads proof file for own certification', async () => {
    const { auth } = await import('@clerk/tanstack-react-start/server')
    const user = await mockAuthForRole('User', auth)

    const certId = '123e4567-e89b-12d3-a456-426614174000'
    const existingCert = factories.certification({
      id: certId,
      userId: user.id,
    })
    const newProof = {
      id: 'proof-456',
      userCertificationId: certId,
      fileName: 'certificate.pdf',
      fileUrl: 'https://example.test/certification-proofs/cert/certificate.pdf',
    }

    await setupTestMocks(user, existingCert, {
      dbSequence: [[existingCert], [newProof], [{}], [{}]],
    })

    const { handlePostCertificationProof } =
      await import('../certificationProofUpload.server')

    const form = new FormData()
    form.append('certificationId', certId)
    form.append(
      'file',
      new File([new Uint8Array([1, 2, 3])], 'certificate.pdf', {
        type: 'application/pdf',
      }),
    )

    const request = new Request('http://localhost/api/certifications/proof', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    request.formData = vi.fn().mockResolvedValue(form)

    const response = await handlePostCertificationProof(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.proof).toMatchObject({ fileName: 'certificate.pdf' })
  })

  it('returns 400 when Content-Type is not multipart', async () => {
    const { auth } = await import('@clerk/tanstack-react-start/server')
    const user = await mockAuthForRole('User', auth)
    await setupTestMocks(user, [])

    const { handlePostCertificationProof } =
      await import('../certificationProofUpload.server')

    const request = new Request('http://localhost/api/certifications/proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await handlePostCertificationProof(request)
    expect(response.status).toBe(400)
  })
})
