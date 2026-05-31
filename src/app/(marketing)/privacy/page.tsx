export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080c14', color: '#f0f0f0', padding: '48px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.8 }}>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>プライバシーポリシー</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 40 }}>最終更新: 2026年6月1日</p>

        <Section title="1. 事業者情報">
          <p>ITO Yuichi（以下「当社」）は、SpotCast（以下「本サービス」）において、ユーザーの個人情報を適切に取り扱うため、本プライバシーポリシーを定めます。</p>
        </Section>

        <Section title="2. 収集する情報">
          <ul>
            <li><strong>アカウント情報</strong>: メールアドレス、パスワード（ハッシュ化）</li>
            <li><strong>位置情報</strong>: ユーザーが登録した圃場・ポイントの緯度経度</li>
            <li><strong>決済情報</strong>: クレジットカード情報はStripe社が管理し、当社は保持しません</li>
            <li><strong>利用情報</strong>: アクセスログ、機能の利用状況</li>
          </ul>
        </Section>

        <Section title="3. 利用目的">
          <ul>
            <li>本サービスの提供・運営・改善</li>
            <li>サブスクリプション管理・請求処理</li>
            <li>お問い合わせへの対応</li>
            <li>不正利用の防止</li>
            <li>サービスに関する重要なお知らせの送信</li>
          </ul>
        </Section>

        <Section title="4. 第三者への提供">
          <p>当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。</p>
          <ul>
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>サービス運営に必要な業務委託先（Supabase、Stripe等）への提供</li>
          </ul>
        </Section>

        <Section title="5. 業務委託先への提供">
          <p>当社は、サービス提供のために必要な範囲で、業務委託先（クラウドサービス事業者等）に個人情報を提供することがあります。委託先に対しては適切な監督を行います。</p>
        </Section>

        <Section title="6. Cookieの利用">
          <p>本サービスは、認証セッションの維持のためにCookieを使用します。ブラウザの設定によりCookieを無効にすることができますが、その場合一部機能が利用できなくなる場合があります。</p>
        </Section>

        <Section title="7. 個人情報の管理">
          <p>当社は、個人情報への不正アクセス・漏洩・改ざんを防ぐため、適切なセキュリティ対策を実施します。</p>
        </Section>

        <Section title="8. 開示・訂正・削除">
          <p>ユーザーは、保有する個人情報の開示・訂正・削除を請求できます。お問い合わせフォームまたは <a href="mailto:yuichi7759@gmail.com" style={{ color: '#60a5fa' }}>yuichi7759@gmail.com</a> までご連絡ください。</p>
        </Section>

        <Section title="9. 本ポリシーの変更">
          <p>当社は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、本サービス上でお知らせします。</p>
        </Section>

        <Section title="10. お問い合わせ">
          <p>個人情報に関するご質問・ご要望は、<a href="mailto:yuichi7759@gmail.com" style={{ color: '#60a5fa' }}>yuichi7759@gmail.com</a> までお問い合わせください。</p>
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
