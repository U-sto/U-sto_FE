/**
 * PUT /api/g2b/add-drbYr — G2B 내용연수(drbYr) 일괄 최신화
 *
 * npm run sync-g2b-drb-yr
 *
 * 주소/토큰:
 *   API_URL — 미설정 시 VITE_API_BASE_URL → 마지막으로 vite 기본값(개발 서버)
 *   로컬 Spring만 쓸 때: API_URL=http://localhost:8080 npm run sync-g2b-drb-yr
 *   SYNC_AUTH_TOKEN=JWT (필요 시)
 */

const DEFAULT_DEV_API = 'http://13.124.10.41:8080'

const API_URL = (
  process.env.API_URL ??
  process.env.VITE_API_BASE_URL ??
  DEFAULT_DEV_API
)
  .trim()
  .replace(/\/$/, '')

const token = process.env.SYNC_AUTH_TOKEN?.trim()

const url = `${API_URL}/api/g2b/add-drbYr`
/** @type {Record<string, string>} */
const headers = { Accept: 'application/json' }
if (token) {
  headers.Authorization = `Bearer ${token}`
}

console.log(`PUT ${url}`)

try {
  const res = await fetch(url, { method: 'PUT', headers })
  const text = await res.text()
  /** @type {unknown} */
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }

  console.log('status:', res.status)
  console.log('body:', body)

  if (!res.ok) {
    process.exit(1)
  }
} catch (err) {
  const code =
    err && typeof err === 'object' && 'cause' in err && err.cause && typeof err.cause === 'object'
      ? /** @type {{ code?: string }} */ (err.cause).code
      : undefined

  console.error('\n[sync-g2b-drb-yr] 요청 실패:', err instanceof Error ? err.message : err)

  if (code === 'ECONNREFUSED') {
    console.error(`
→ ${API_URL} 에 연결되지 않습니다. (백엔드가 꺼져 있거나 주소가 다릅니다.)

  • 로컬에서 Spring을 띄웠다면:
    API_URL=http://localhost:8080 npm run sync-g2b-drb-yr

  • 다른 서버를 쓰면 API_URL을 그 주소로 지정하세요.
`)
  }

  process.exit(1)
}
