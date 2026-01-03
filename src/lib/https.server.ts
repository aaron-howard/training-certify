/**
 * HTTPS Enforcement Middleware
 * Redirects HTTP requests to HTTPS in production
 */

/**
 * Check if HTTPS enforcement is enabled
 */
export function isHTTPSEnforced(): boolean {
  return (
    process.env.HTTPS_ONLY === 'true' && process.env.NODE_ENV === 'production'
  )
}

/**
 * Enforce HTTPS for a request
 * Redirects to HTTPS if request is HTTP
 */
export function enforceHTTPS(request: Request): Response | null {
  if (!isHTTPSEnforced()) {
    return null
  }

  const url = new URL(request.url)

  // Already HTTPS
  if (url.protocol === 'https:') {
    return null
  }

  // Redirect to HTTPS
  url.protocol = 'https:'

  return new Response(null, {
    status: 301,
    headers: {
      Location: url.toString(),
    },
  })
}

/**
 * Get HTTPS redirect response if needed
 */
export function checkHTTPSRedirect(request: Request): Response | null {
  return enforceHTTPS(request)
}
