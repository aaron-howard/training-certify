/**
 * Persists certification proof files to Vercel Blob.
 * Requires BLOB_READ_WRITE_TOKEN in production; tests use a deterministic stub URL.
 */

import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'
import { AppError } from './errors'

/** Max proof file size (10 MB). */
export const CERTIFICATION_PROOF_MAX_BYTES = 10 * 1024 * 1024

const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
])

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png'])

export function sanitizeProofFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? 'proof'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
  return cleaned.length > 0 ? cleaned : 'proof'
}

export function assertAllowedProofFile(
  fileName: string,
  contentType: string,
  sizeBytes: number,
): void {
  if (sizeBytes <= 0 || sizeBytes > CERTIFICATION_PROOF_MAX_BYTES) {
    throw new AppError(
      `Proof file must be between 1 byte and ${CERTIFICATION_PROOF_MAX_BYTES} bytes`,
      400,
    )
  }

  const ext = fileName.includes('.')
    ? `.${fileName.split('.').pop()!.toLowerCase()}`
    : ''
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new AppError(
      'Proof file must be PDF, JPEG, or PNG (.pdf, .jpg, .jpeg, .png)',
      400,
    )
  }

  const normalizedType = contentType.split(';')[0]?.trim().toLowerCase() ?? ''
  if (!ALLOWED_CONTENT_TYPES.has(normalizedType)) {
    throw new AppError(
      'Proof file type must be application/pdf, image/jpeg, or image/png',
      400,
    )
  }
}

export type UploadCertificationProofInput = {
  data: Uint8Array
  contentType: string
  fileName: string
  userId: string
  certificationId: string
}

export type UploadCertificationProofResult = {
  fileUrl: string
  fileName: string
}

/**
 * Upload proof bytes to blob storage and return a stable HTTPS URL.
 */
export async function uploadCertificationProof(
  input: UploadCertificationProofInput,
): Promise<UploadCertificationProofResult> {
  const safeName = sanitizeProofFileName(input.fileName)
  assertAllowedProofFile(safeName, input.contentType, input.data.byteLength)

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    if (process.env.NODE_ENV === 'test') {
      return {
        fileName: safeName,
        fileUrl: `https://example.test/certification-proofs/${input.certificationId}/${safeName}`,
      }
    }
    throw new AppError(
      'Proof uploads are not configured (missing BLOB_READ_WRITE_TOKEN)',
      503,
    )
  }

  const pathname = `certification-proofs/${input.userId}/${input.certificationId}/${randomUUID()}-${safeName}`

  const blob = await put(pathname, Buffer.from(input.data), {
    access: 'public',
    contentType: input.contentType.split(';')[0]?.trim(),
    token,
    addRandomSuffix: false,
  })

  return {
    fileName: safeName,
    fileUrl: blob.url,
  }
}
