import { ENV, envReady } from './src/lib/env'

async function checkClerk() {
  await envReady
  console.log(
    'CLERK_SECRET_KEY loaded:',
    ENV.CLERK_SECRET_KEY
      ? 'Yes (length: ' + ENV.CLERK_SECRET_KEY.length + ')'
      : 'No',
  )
}

checkClerk().catch(console.error)
