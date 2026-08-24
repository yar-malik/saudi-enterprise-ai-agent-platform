/**
 * See what would be stripped before anything left your estate.
 *
 * No dependencies and no build step — Node 18 or newer.
 *
 *   export VOHO_API_KEY=voho_sk_live_...   # app.voho.ai -> API Tokens
 *   npm start
 *
 * New accounts start with $25 of credit, so this costs nothing to try.
 */
const KEY = process.env.VOHO_API_KEY
const BASE = process.env.VOHO_BASE_URL ?? 'https://app.voho.ai'

if (!KEY) {
  console.error('Set VOHO_API_KEY first — create one at https://app.voho.ai/tokens')
  process.exit(1)
}

async function voho(path, body, raw = false) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    console.error(`${detail.error?.code ?? res.status}: ${detail.error?.message ?? 'request failed'}`)
    process.exit(1)
  }
  return raw ? Buffer.from(await res.arrayBuffer()) : res.json()
}

function spent(cents) {
  console.log(`\nCharged $${(cents / 100).toFixed(2)} from your Voho balance.`)
}

const record = process.argv.slice(2).join(' ') || `تذكرة دعم رقم 4471
العميل: عبدالله بن سعد القحطاني، هوية وطنية 1082345671
جوال: 0555 123 456 — البريد: a.alqahtani@example.com
الآيبان: SA44 2000 0001 2345 6789 1234
الملاحظة: بطاقته المنتهية 4242 رُفضت، ويطلب استرجاع 3,450 ريال.`

console.log('Checking what would leave the estate…\n')
const out = await voho('/v1/privacy/redact', { text: record })

console.log(out.verdict, '\n')
console.log(out.redacted, '\n')
for (const f of out.findings) console.log(`${f.action.padEnd(7)}${f.kind} — ${f.why}`)
spent(out.cost_cents)
