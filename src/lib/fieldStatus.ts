export type FieldStatusType = 'good' | 'warning' | 'urgent' | 'unknown'

export interface FieldStatus {
  status: FieldStatusType
  growthDays: number | null
  stage: string
  nextAction: string
  color: string
  glowColor: string
  progress: number // 0~1
}

export const STATUS_COLORS: Record<FieldStatusType, { bg: string; glow: string }> = {
  good:    { bg: '#60a5fa', glow: '#60a5facc' },
  warning: { bg: '#f59e0b', glow: '#f59e0bcc' },
  urgent:  { bg: '#ef4444', glow: '#ef4444cc' },
  unknown: { bg: '#94a3b8', glow: '#94a3b855' },
}

export function calcFieldStatus(field: {
  planted_at?: string | null
  crop?: string | null
}): FieldStatus {
  return {
    status: 'good',
    growthDays: null,
    progress: 0,
    stage: field.crop ?? '登録済みポイント',
    nextAction: '',
    color: STATUS_COLORS.good.bg,
    glowColor: STATUS_COLORS.good.glow,
  }
}
