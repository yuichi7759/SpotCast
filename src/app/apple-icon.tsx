import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const PIN =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='110' height='147' viewBox='0 0 60 80'>` +
      `<defs><linearGradient id='g' x1='10%' y1='0%' x2='90%' y2='100%'>` +
      `<stop offset='0%' stop-color='#fcd34d'/><stop offset='42%' stop-color='#cdd9e6'/><stop offset='100%' stop-color='#1d4ed8'/>` +
      `</linearGradient></defs>` +
      `<path d='M30 3 C14 3 2 14 2 28 C2 38 7 46 15 54 C20 59 26 65 30 74 C34 65 40 59 45 54 C53 46 58 38 58 28 C58 14 46 3 30 3Z' fill='url(%23g)'/>` +
      `<circle cx='30' cy='28' r='11' fill='white'/>` +
      `</svg>`,
  )

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0e16',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PIN} width={110} height={147} alt="" />
      </div>
    ),
    { ...size },
  )
}
