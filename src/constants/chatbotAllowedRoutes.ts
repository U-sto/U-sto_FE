import { menuData, type MenuItem } from './menu'
import type { AiChatActionButton } from '../api/supportChat'

function flattenMenuPaths(items: MenuItem[]): string[] {
  const out: string[] = []
  for (const item of items) {
    if (item.path) out.push(item.path)
    if (item.children?.length) {
      for (const c of item.children) {
        if (c.path) out.push(c.path)
      }
    }
  }
  return out
}

/** GNB 메뉴에 정의된 path */
const PATHS_FROM_MENU = new Set(menuData.flatMap((s) => flattenMenuPaths(s.items)))

/**
 * 메뉴에 없지만 실제 라우트인 path (App.tsx / AssetManagementRoutes / UserInfoRoutes)
 */
const EXTRA_EXACT_PATHS: string[] = [
  '/home',
  '/ai-forecast',
  '/acq-confirmation',
  '/operation-management',
  '/return-management',
  '/disuse-management',
  '/disposal-management',
  '/user-info',
  '/user-info/change-password',
  '/user-info/change-password/complete',
  '/user-info/change-phone',
  '/user-info/change-phone/complete',
  '/user-info/withdraw',
  '/user-info/withdraw/complete',
  '/asset-management/acquisition-management/register',
  '/asset-management/operation-management/operation-transfer',
  '/asset-management/operation-management/operation-ledger/detail',
  '/asset-management/operation-management/operation-transfer/register',
  '/asset-management/operation-management/return-management/register',
  '/asset-management/disuse-management/register',
  '/asset-management/disposal-management/register',
  '/asset-management/inventory-status/detail',
]

const EXACT_PATHS = new Set<string>([...PATHS_FROM_MENU, ...EXTRA_EXACT_PATHS])

/**
 * 백엔드 action_buttons url → 앱 실제 라우트.
 * 짧은 path(/acquisition-management 등)는 asset-management 하위로 매핑.
 * /return-management 등 요청관리 path는 그대로 두고 별칭하지 않음.
 */
const CHATBOT_ACTION_BUTTON_PATH_ALIASES: Record<string, string> = {
  '/acquisition-management': '/asset-management/acquisition-management',
  '/operation-transfer': '/asset-management/operation-management/operation-transfer',
  '/operation-ledger': '/asset-management/operation-management/operation-ledger',
  '/printout-management': '/asset-management/operation-management/printout-management',
  '/inventory-status': '/asset-management/inventory-status',
}

function resolveChatbotActionPath(pathname: string): string {
  return CHATBOT_ACTION_BUTTON_PATH_ALIASES[pathname] ?? pathname
}

/** :id 한 단만 허용 (백엔드가 준 동적 상세 URL) */
const EDIT_ID_PREFIXES = [
  '/asset-management/acquisition-management/edit/',
  '/asset-management/operation-management/operation-transfer/edit/',
  '/asset-management/operation-management/return-management/edit/',
  '/asset-management/disuse-management/edit/',
  '/asset-management/disposal-management/edit/',
] as const

export function normalizeChatbotPathname(url: string): string | null {
  const t = url.trim()
  if (!t) return null
  let path: string
  if (t.startsWith('/')) {
    path = t.split('?')[0].split('#')[0]
  } else {
    try {
      path = new URL(t).pathname
    } catch {
      return null
    }
  }
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path || '/'
}

export function isAllowedChatbotPathname(pathname: string): boolean {
  if (EXACT_PATHS.has(pathname)) return true
  for (const prefix of EDIT_ID_PREFIXES) {
    if (!pathname.startsWith(prefix)) continue
    const rest = pathname.slice(prefix.length)
    if (rest.length > 0 && !rest.includes('/')) return true
  }
  return false
}

/** API action_buttons: 화이트리스트 path만 남기고 url 기준 중복 제거 */
export function filterChatbotActionButtons(buttons: AiChatActionButton[]): AiChatActionButton[] {
  const seen = new Set<string>()
  const out: AiChatActionButton[] = []
  for (const b of buttons) {
    const rawPath = normalizeChatbotPathname(b.url)
    if (!rawPath) continue
    const path = resolveChatbotActionPath(rawPath)
    if (!isAllowedChatbotPathname(path)) continue
    if (seen.has(path)) continue
    seen.add(path)
    out.push({ label: b.label, url: path })
  }
  return out
}

/** 백엔드 action_buttons만 렌더 — url 중복 제거·허용 경로 필터 */
export function normalizeApiActionButtons(
  buttons: AiChatActionButton[] | undefined,
): AiChatActionButton[] | undefined {
  if (!Array.isArray(buttons) || buttons.length === 0) return undefined
  const filtered = filterChatbotActionButtons(buttons)
  return filtered.length > 0 ? filtered : undefined
}
