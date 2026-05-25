import { createFileRoute } from '@tanstack/react-router'
import { handlePostCertificationProof } from '../lib/certificationProofUpload.server'

export const Route = createFileRoute('/api/certifications/proof')({
  server: {
    handlers: {
      POST: async ({ request }) => handlePostCertificationProof(request),
    },
  },
})
