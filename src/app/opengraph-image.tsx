import { ImageResponse } from 'next/og'

export const alt = 'SpotCast — Pinpoint weather for every spot you care about'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PIN =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='200' viewBox='0 0 60 80'>` +
      `<defs><linearGradient id='g' x1='10%' y1='0%' x2='90%' y2='100%'>` +
      `<stop offset='0%' stop-color='#fcd34d'/><stop offset='42%' stop-color='#b8cad8'/><stop offset='100%' stop-color='#1d4ed8'/>` +
      `</linearGradient></defs>` +
      `<path d='M30 3 C14 3 2 14 2 28 C2 38 7 46 15 54 C20 59 26 65 30 74 C34 65 40 59 45 54 C53 46 58 38 58 28 C58 14 46 3 30 3Z' fill='url(%23g)'/>` +
      `<circle cx='30' cy='28' r='11' fill='white'/>` +
      `</svg>`,
  )

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '0 96px',
          background: 'linear-gradient(135deg, #0e1c34 0%, #080b12 72%)',
          color: '#ffffff', fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PIN} width={104} height={138} alt="" />
          <div style={{ fontSize: 110, fontWeight: 800, letterSpacing: -4 }}>SpotCast</div>
        </div>
        <div style={{ fontSize: 44, color: '#d9e4f5', marginTop: 30, fontWeight: 600 }}>
          Pinpoint weather for every spot you care about
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 26 }}>
          {['Real-time', '14-day forecast', 'Rain radar'].map(t => (
            <div
              key={t}
              style={{
                fontSize: 28, color: '#9ec5ff', padding: '8px 20px',
                border: '1px solid #2a4670', borderRadius: 999, background: 'rgba(110,168,255,0.08)',
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
