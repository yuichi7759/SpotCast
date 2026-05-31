export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080c14', color: '#f0f0f0', padding: '48px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.8 }}>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>利用規約</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 40 }}>最終更新: 2026年6月1日</p>

        <Section title="第1条（適用）">
          <p>本利用規約（以下「本規約」）は、SpotCast（以下「当社」）が提供する本サービスの利用に関する条件を定めるものです。ユーザーは本規約に同意した上で本サービスを利用するものとします。</p>
        </Section>

        <Section title="第2条（アカウント）">
          <ul>
            <li>本サービスの利用にはアカウント登録が必要です。</li>
            <li>ユーザーはアカウント情報を正確に保ち、パスワードを適切に管理する責任を負います。</li>
            <li>アカウントの不正利用が発覚した場合は、速やかに当社へご連絡ください。</li>
          </ul>
        </Section>

        <Section title="第3条（プランと料金）">
          <ul>
            <li><strong>Freeプラン</strong>: 無料。一部機能に制限があります。</li>
            <li><strong>Standardプラン</strong>: 月額980円（税込）。全機能が利用可能。</li>
            <li>料金はStripe社を通じてクレジットカードにより毎月自動決済されます。</li>
            <li>解約はいつでも可能で、解約後は当該月末まで利用できます。</li>
            <li>デジタルサービスの性質上、原則として返金はお受けできません。</li>
          </ul>
        </Section>

        <Section title="第4条（禁止事項）">
          <p>ユーザーは以下の行為を行ってはなりません。</p>
          <ul>
            <li>法令または公序良俗に違反する行為</li>
            <li>本サービスへの不正アクセスやシステムへの干渉</li>
            <li>他のユーザーや第三者の権利を侵害する行為</li>
            <li>本サービスを通じて取得した情報の無断転載・二次利用</li>
            <li>本サービスのリバースエンジニアリング</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ul>
        </Section>

        <Section title="第5条（サービスの変更・停止）">
          <p>当社は、事前の通知なく本サービスの内容の変更、一時停止、または終了を行うことがあります。これによりユーザーに生じた損害について、当社は責任を負いません。</p>
        </Section>

        <Section title="第6条（免責事項）">
          <ul>
            <li>本サービスが提供する気象情報は参考情報であり、正確性・完全性を保証するものではありません。</li>
            <li>本サービスの利用により生じた損害について、当社は故意・重過失がない限り責任を負いません。</li>
            <li>外部APIやサービス（気象庁、Mapbox等）の障害・仕様変更による影響について、当社は責任を負いません。</li>
          </ul>
        </Section>

        <Section title="第7条（知的財産権）">
          <p>本サービスに関する知的財産権は当社に帰属します。ユーザーが登録したデータの権利はユーザーに帰属します。</p>
        </Section>

        <Section title="第8条（アカウントの停止・削除）">
          <p>当社は、ユーザーが本規約に違反した場合、事前の通知なくアカウントを停止または削除することがあります。</p>
        </Section>

        <Section title="第9条（規約の変更）">
          <p>当社は、必要に応じて本規約を変更することがあります。変更後の規約は本サービス上に掲載した時点で効力を生じるものとします。</p>
        </Section>

        <Section title="第10条（準拠法・管轄）">
          <p>本規約は日本法に準拠します。本サービスに関する紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </Section>

        <Section title="お問い合わせ">
          <p><a href="mailto:yuichi7759@gmail.com" style={{ color: '#60a5fa' }}>yuichi7759@gmail.com</a></p>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#fff' }}>{title}</h2>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{children}</div>
    </section>
  )
}
