import { describe, expect, it } from 'vitest'
import {
  CERTIFICATION_PROOF_MAX_BYTES,
  assertAllowedProofFile,
  sanitizeProofFileName,
  uploadCertificationProof,
} from '../certificationProofStorage.server'

describe('certificationProofStorage', () => {
  it('sanitizes unsafe file names', () => {
    expect(sanitizeProofFileName('../../evil.pdf')).toBe('evil.pdf')
    expect(sanitizeProofFileName('')).toBe('proof')
  })

  it('rejects oversized files', () => {
    expect(() =>
      assertAllowedProofFile(
        'doc.pdf',
        'application/pdf',
        CERTIFICATION_PROOF_MAX_BYTES + 1,
      ),
    ).toThrow()
  })

  it('rejects disallowed extensions', () => {
    expect(() =>
      assertAllowedProofFile('script.exe', 'application/pdf', 100),
    ).toThrow()
  })

  it('uploads with stub URL in test environment', async () => {
    const result = await uploadCertificationProof({
      data: new Uint8Array([1, 2, 3]),
      contentType: 'application/pdf',
      fileName: 'cert.pdf',
      userId: 'user-1',
      certificationId: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.fileUrl).toMatch(/^https:\/\/example\.test\//)
    expect(result.fileName).toBe('cert.pdf')
  })
})
