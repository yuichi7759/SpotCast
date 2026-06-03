// 登録スポットの並び順を localStorage で共有するユーティリティ。
// PointList と BestDayMatrix が同じ順序を参照する。

export const SPOT_ORDER_KEY = 'spotcast:spotOrder'

export function loadOrder(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SPOT_ORDER_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveOrder(ids: string[]): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(SPOT_ORDER_KEY, JSON.stringify(ids)) } catch {}
}

// 保存順に従って並べ替える。未知のID（新規）は末尾に元の順で残す（安定）。
export function applyOrder<T extends { id: string }>(items: T[], orderIds: string[]): T[] {
  const rank = new Map(orderIds.map((id, i) => [id, i]))
  return [...items].sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id)! : Infinity
    const rb = rank.has(b.id) ? rank.get(b.id)! : Infinity
    return ra - rb
  })
}
