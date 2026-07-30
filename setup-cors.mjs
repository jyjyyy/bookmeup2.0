/**
 * Configure CORS on Firebase Storage bucket using service account credentials.
 * Run with: node setup-cors.mjs
 */
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Load .env.local
const envPath = path.resolve('./.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const PROJECT_ID = env.FIREBASE_ADMIN_PROJECT_ID
const CLIENT_EMAIL = env.FIREBASE_ADMIN_CLIENT_EMAIL
const PRIVATE_KEY = env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')

// Try both bucket naming conventions
const BUCKETS = [
  `${PROJECT_ID}.firebasestorage.app`,
  `${PROJECT_ID}.appspot.com`,
]

console.log(`Service account: ${CLIENT_EMAIL}`)
console.log(`Will try buckets: ${BUCKETS.join(', ')}`)

// --- Step 1: Create JWT ---
function base64url(obj) {
  return Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const now = Math.floor(Date.now() / 1000)
const header = { alg: 'RS256', typ: 'JWT' }
const payload = {
  iss: CLIENT_EMAIL,
  scope: 'https://www.googleapis.com/auth/devstorage.full_control',
  aud: 'https://oauth2.googleapis.com/token',
  iat: now,
  exp: now + 3600,
}

const unsignedToken = `${base64url(header)}.${base64url(payload)}`
const sign = crypto.createSign('RSA-SHA256')
sign.update(unsignedToken)
const signature = sign.sign(PRIVATE_KEY, 'base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '')

const jwt = `${unsignedToken}.${signature}`

// --- Step 2: Exchange JWT for access token ---
console.log('Getting access token...')
const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  }),
})

if (!tokenRes.ok) {
  const err = await tokenRes.text()
  console.error('Token error:', err)
  process.exit(1)
}

const { access_token } = await tokenRes.json()
console.log('Got access token ✓')

// --- Step 3: Set CORS on the bucket ---
const corsConfig = [
  {
    origin: ['http://localhost:3000', 'https://bookmeup.com', 'https://*.bookmeup.com'],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
    maxAgeSeconds: 3600,
    responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
  },
]

let success = false
let workingBucket = null

for (const bucket of BUCKETS) {
  console.log(`\nTrying bucket: ${bucket}...`)
  const corsRes = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${bucket}?fields=cors`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cors: corsConfig }),
    },
  )

  if (corsRes.ok) {
    const result = await corsRes.json()
    console.log(`CORS configured successfully on ${bucket} ✓`)
    console.log(JSON.stringify(result, null, 2))
    success = true
    workingBucket = bucket
    break
  } else {
    const err = await corsRes.json().catch(() => ({}))
    console.log(`  → ${err?.error?.message || 'Failed'} (skipping)`)
  }
}

if (!success) {
  console.error('\n❌ Could not find the bucket. Please check Firebase Console > Storage for the correct bucket name.')
  console.log('\nYou can also run: node setup-cors.mjs YOUR_BUCKET_NAME')
  process.exit(1)
}

// If the working bucket differs from what's in the code, warn the user
if (workingBucket && workingBucket !== `${PROJECT_ID}.appspot.com`) {
  console.log(`\n⚠️  IMPORTANT: Your bucket is "${workingBucket}"`)
  console.log(`   Update storageBucket in src/lib/firebaseClient.ts and src/lib/firebaseAdmin.ts`)
}
