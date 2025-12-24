import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { getRouter } from './router'

const router = getRouter()

// @ts-ignore
hydrateRoot(document, <StartClient router={router} />)
