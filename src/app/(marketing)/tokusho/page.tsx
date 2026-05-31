export default function TokushoPage() {
  const rows = [
    { label: '販売事業者', value: '伊藤悠一' },
    { label: '所在地', value: '請求があり次第、遅滞なく開示します' },
    { label: '電話番号', value: '請求があり次第、遅滞なく開示します' },
    { label: 'メールアドレス', value: 'yuichi7759@gmail.com' },
    { label: 'サービス名', value: 'SpotCast' },
    { label: 'サービスの内容', value: '農業向け気象・圃場管理ダッシュボード（Proプラン：全機能利用可）' },
    { label: '販売価格', value: '月額980円（税込）' },
    { label: '支払方法', value: 'クレジットカード（Stripe経由）' },
    { label: '支払時期', value: '申し込み時および毎月の更新日に自動決済' },
    { label: 'サービス提供時期', value: '決済完了後、即時利用可能' },
    { label: 'キャンセル・解約', value: 'マイページよりいつでも解約可能。解約後は当該月末までご利用いただけます。' },
    { label: '返金ポリシー', value: 'デジタルサービスの性質上、原則として返金はお受けできません。' },
    { label: '動作環境', value: '最新版のChrome・Safari・Firefox・Edgeを推奨' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080c14', color: '#f0f0f0', padding: '48px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>特定商取引法に基づく表記</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>
          特定商取引に関する法律第11条に基づき、以下の通り表示します。
        </p>

        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
          {rows.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <div style={{
                width: 180, flexShrink: 0,
                padding: '14px 16px',
                fontSize: 13, fontWeight: 700,
                color: 'rgba(255,255,255,0.45)',
                background: 'rgba(255,255,255,0.03)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
              }}>
                {row.label}
              </div>
              <div style={{ padding: '14px 16px', fontSize: 14, lineHeight: 1.7 }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 32, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          最終更新: 2026年6月1日
        </p>
      </div>
    </div>
  )
}
