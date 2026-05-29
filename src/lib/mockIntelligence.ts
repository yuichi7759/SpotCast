export type EventType = 'planting' | 'pest' | 'weather' | 'harvest' | 'anomaly' | 'trend'
export type Severity  = 'info' | 'warning' | 'alert'

export const EVENT_CFG: Record<EventType, { label: string; color: string; icon: string }> = {
  weather:  { label: '気象',     color: '#60a5fa', icon: '⛅' },
  anomaly:  { label: '警報',     color: '#f87171', icon: '⚠️' },
  trend:    { label: 'トレンド', color: '#a78bfa', icon: '📈' },
  planting: { label: '気温',     color: '#34d399', icon: '🌡️' },
  pest:     { label: '大雨',     color: '#818cf8', icon: '🌧️' },
  harvest:  { label: '晴れ',     color: '#fbbf24', icon: '☀️' },
}

export const SEVERITY_CFG: Record<Severity, { label: string; badge: string; ring: string }> = {
  info:    { label: 'INFO',    badge: '#94a3b8', ring: 'rgba(148,163,184,0.15)' },
  warning: { label: 'WARNING', badge: '#f59e0b', ring: 'rgba(245,158,11,0.15)'  },
  alert:   { label: 'ALERT',  badge: '#ef4444', ring: 'rgba(239,68,68,0.15)'   },
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)  return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}時間前`
  return `${Math.floor(h / 24)}日前`
}

export interface IntelligenceEvent {
  id: string
  type: EventType
  severity: Severity
  title: string
  body: string
  region: string
  lat: number
  lng: number
  timestamp: string
  source: string
  sourceUrl?: string
  isMock?: boolean
  radius?: number
}

export const MOCK_EVENTS: IntelligenceEvent[] = [
  {
    id: 'e1',
    type: 'weather',
    severity: 'warning',
    title: '梅雨前線北上中（西日本）',
    body: '梅雨前線が29日にかけて本州南岸を北上する見込み。近畿・東海・関東では断続的な雨となる予報。低地での浸水に注意。',
    region: '西日本〜東海',
    lat: 34.69, lng: 135.50,
    timestamp: '2026-05-28T06:00:00Z',
    source: '気象庁',
    sourceUrl: 'https://www.jma.go.jp/bosai/forecast/',
    isMock: true,
    radius: 150,
  },
  {
    id: 'e2',
    type: 'anomaly',
    severity: 'alert',
    title: '台風2号発生（フィリピン東方）',
    body: 'フィリピン東方海上で台風2号が発生。今後の進路によっては来週後半に沖縄・九州へ影響が出る可能性。最新情報に注意。',
    region: '南西諸島',
    lat: 26.20, lng: 127.68,
    timestamp: '2026-05-27T12:00:00Z',
    source: '気象庁',
    sourceUrl: 'https://www.jma.go.jp/bosai/typhoon/',
    isMock: true,
    radius: 200,
  },
  {
    id: 'e3',
    type: 'weather',
    severity: 'warning',
    title: '北海道で低温注意（十勝）',
    body: '北海道十勝地方で今週末の最低気温が5℃を下回る予報。外出時は防寒対策を忘れずに。霜の可能性もあり。',
    region: '北海道十勝',
    lat: 42.92, lng: 143.20,
    timestamp: '2026-05-27T04:00:00Z',
    source: '気象庁',
    sourceUrl: 'https://www.jma.go.jp/bosai/forecast/',
    isMock: true,
    radius: 50,
  },
  {
    id: 'e4',
    type: 'weather',
    severity: 'info',
    title: '関東で週末晴れ予報',
    body: '関東甲信は土日とも高気圧に覆われ、晴れて気温も上昇。最高気温30℃超の夏日となる見込み。熱中症対策を。',
    region: '関東甲信',
    lat: 35.68, lng: 139.69,
    timestamp: '2026-05-28T06:00:00Z',
    source: '気象庁',
    sourceUrl: 'https://www.jma.go.jp/bosai/forecast/',
    isMock: true,
    radius: 80,
  },
  {
    id: 'e5',
    type: 'trend',
    severity: 'info',
    title: '今年の梅雨、例年より早い傾向',
    body: '気象庁の3ヶ月予報によると、今年の梅雨入りは平年より5〜7日早くなる見通し。降水量も平年並みか多い見込み。',
    region: '全国',
    lat: 36.00, lng: 138.00,
    timestamp: '2026-05-25T10:00:00Z',
    source: 'SpotCast AI 分析（サンプル）',
    isMock: true,
    radius: 0,
  },
  {
    id: 'e6',
    type: 'weather',
    severity: 'info',
    title: '梅雨入り5/29頃（近畿）',
    body: '近畿地方は5月29日頃の梅雨入りが見込まれます。週末のうちに屋外作業や洗濯など雨に備えた準備を。',
    region: '近畿',
    lat: 34.72, lng: 135.50,
    timestamp: '2026-05-28T07:00:00Z',
    source: '気象庁',
    sourceUrl: 'https://www.jma.go.jp/bosai/forecast/',
    isMock: true,
    radius: 60,
  },
]
