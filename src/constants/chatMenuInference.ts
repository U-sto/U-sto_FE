import { menuData, type MenuItem } from './menu'
import type { AiChatActionButton } from '../api/supportChat'
import { filterChatbotActionButtons } from './chatbotAllowedRoutes'

function flattenMenuItemsWithPaths(items: MenuItem[]): { label: string; path: string }[] {
  const out: { label: string; path: string }[] = []
  for (const item of items) {
    if (item.path) out.push({ label: item.label, path: item.path })
    if (item.children?.length) {
      for (const c of item.children) {
        if (c.path) out.push({ label: c.label, path: c.path })
      }
    }
  }
  return out
}

function allMenuLinks(): { label: string; path: string }[] {
  const acc: { label: string; path: string }[] = []
  for (const section of menuData) {
    acc.push(...flattenMenuItemsWithPaths(section.items))
  }
  return acc
}

/** 짧은 토큰만으로 오탐 줄이기: 4자 미만 별칭은 전체 라벨과 같을 때만 사용 */
function labelVariants(label: string): string[] {
  const lower = label.toLowerCase().replace(/\s+/g, ' ').trim()
  const stripped = lower.replace(/^물품\s+/, '').trim()
  const set = new Set<string>([lower])
  if (stripped && stripped !== lower) set.add(stripped)
  return [...set]
}

function textMentionsLabel(haystack: string, label: string): boolean {
  const hayCompact = haystack.replace(/\s/g, '')
  const variants = labelVariants(label)
  const fullNorm = label.toLowerCase().replace(/\s+/g, ' ').trim()
  return variants.some((v) => {
    if (v.length < 2) return false
    if (v.length < 4 && v !== fullNorm) return false
    const vCompact = v.replace(/\s/g, '')
    return (
      haystack.includes(v) || (vCompact.length >= 4 && hayCompact.includes(vCompact))
    )
  })
}

/**
 * 사용자 질문·AI 답변 텍스트에서 GNB 메뉴 키워드가 보이면 해당 화면 바로가기 버튼 후보 생성.
 * API의 action_buttons와 병합해 사용 (동일 path는 API 우선).
 */
export function inferMenuActionButtons(userMessage: string, assistantText: string): AiChatActionButton[] {
  const hay = `${userMessage}\n${assistantText}`.toLowerCase().replace(/\s+/g, ' ')
  const links = allMenuLinks()
  const sorted = [...links].sort((a, b) => b.label.length - a.label.length)
  const seenPath = new Set<string>()
  const out: AiChatActionButton[] = []

  for (const { label, path } of sorted) {
    if (!path || seenPath.has(path)) continue
    if (!textMentionsLabel(hay, label)) continue
    seenPath.add(path)
    out.push({ label: `${label} 바로가기`, url: path })
  }
  return out
}

export function mergeActionButtons(
  apiButtons: AiChatActionButton[] | undefined,
  inferred: AiChatActionButton[],
): AiChatActionButton[] | undefined {
  const normalize = (u: string) => u.trim()
  const seen = new Set<string>()
  const out: AiChatActionButton[] = []

  for (const b of apiButtons ?? []) {
    const u = normalize(b.url)
    if (!u || seen.has(u)) continue
    seen.add(u)
    out.push(b)
  }
  for (const b of inferred) {
    const u = normalize(b.url)
    if (!u || seen.has(u)) continue
    seen.add(u)
    out.push(b)
  }
  const allowed = filterChatbotActionButtons(out)
  return allowed.length > 0 ? allowed : undefined
}
