// 多言語対応の辞書。フラットなドット区切りキーで管理する。
// 新規UIは原則ここにキーを足し、t('key') で参照する。
// 補間は {name} 形式: t('greet', { name: 'X' })

export const dictionaries = {
  ja: {
    // 共通
    'common.save':    '保存',
    'common.cancel':  'キャンセル',
    'common.close':   '閉じる',
    'common.delete':  '削除',
    'common.back':    '戻る',
    'common.loading': '読み込み中...',
    'common.send':    '送信',

    // 言語
    'lang.label':    '言語',
    'lang.ja':       '日本語',
    'lang.en':       'English',

    // 設定
    'settings.title':        '設定',
    'settings.account':      'アカウント',
    'settings.email':        'メールアドレス',
    'settings.plan':         'プラン',
    'settings.appearance':   '外観',
    'settings.theme':        'テーマ',
    'settings.themeLight':   'ライトモード',
    'settings.themeDark':    'ダークモード',
    'settings.markerSize':   'マップのマーカーサイズ',
    'settings.markerSizeHint':'地図上のポイントの大きさ',
    'settings.session':      'セッション',
    'settings.logout':       'ログアウト',
    'settings.support':      'サポート',
    'settings.contact':      'お問い合わせ',
    'settings.upgrade':      'Standardにアップグレード',

    // ダッシュボード
    'dash.mySpots':   'My Spots',
    'dash.bestDay':   'Best Day',
    'dash.addPoint':  'ポイントを追加',
  },
  en: {
    'common.save':    'Save',
    'common.cancel':  'Cancel',
    'common.close':   'Close',
    'common.delete':  'Delete',
    'common.back':    'Back',
    'common.loading': 'Loading...',
    'common.send':    'Send',

    'lang.label':    'Language',
    'lang.ja':       '日本語',
    'lang.en':       'English',

    'settings.title':        'Settings',
    'settings.account':      'Account',
    'settings.email':        'Email',
    'settings.plan':         'Plan',
    'settings.appearance':   'Appearance',
    'settings.theme':        'Theme',
    'settings.themeLight':   'Light',
    'settings.themeDark':    'Dark',
    'settings.markerSize':   'Map marker size',
    'settings.markerSizeHint':'Size of points on the map',
    'settings.session':      'Session',
    'settings.logout':       'Log out',
    'settings.support':      'Support',
    'settings.contact':      'Contact us',
    'settings.upgrade':      'Upgrade to Standard',

    'dash.mySpots':   'My Spots',
    'dash.bestDay':   'Best Day',
    'dash.addPoint':  'Add point',
  },
} as const

export type Locale = keyof typeof dictionaries
export const LOCALES: { id: Locale; labelKey: string }[] = [
  { id: 'ja', labelKey: 'lang.ja' },
  { id: 'en', labelKey: 'lang.en' },
]
