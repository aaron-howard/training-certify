import { createServerFn } from '@tanstack/react-start'

export const checkRpc = createServerFn({ method: 'GET' }).handler(() => {
  console.log('✅ [RPC Check] This should ONLY appear in the TERMINAL.')
  return { message: 'RPC is working', timestamp: Date.now() }
})
