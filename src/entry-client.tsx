import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'

// #region agent log
console.log(
  '[DEBUG:HYDRATE] entry-client.tsx: imports resolved OK, hydrateRoot type:',
  typeof hydrateRoot,
)
// #endregion

try {
  hydrateRoot(document, <StartClient />)
  // #region agent log
  console.log('[DEBUG:HYDRATE] hydrateRoot() called successfully')
  // #endregion
} catch (e) {
  // #region agent log
  console.error('[DEBUG:HYDRATE] hydrateRoot() THREW:', e)
  // #endregion
  throw e
}
