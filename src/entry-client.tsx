import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { envReady } from './lib/env'
import { getRouter } from './router'

async function hydrate() {
    await envReady
    const router = getRouter()
    // @ts-ignore
    hydrateRoot(document, <StartClient router={router} />)
}

hydrate()
