// Spherical approximation — accurate enough for field-scale areas
export function calcPolygonAreaM2(coords: [number, number][]): number {
  if (coords.length < 3) return 0
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const clng = coords.reduce((s, c) => s + c[0], 0) / coords.length
  const clat = coords.reduce((s, c) => s + c[1], 0) / coords.length
  const cosLat = Math.cos(toRad(clat))
  const pts = coords.map(([lng, lat]) => ({
    x: R * toRad(lng - clng) * cosLat,
    y: R * toRad(lat - clat),
  }))
  let area = 0
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const { x: x1, y: y1 } = pts[i]
    const { x: x2, y: y2 } = pts[(i + 1) % n]
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area / 2)
}

export function formatArea(m2: number): string {
  if (m2 >= 10000) return `${(m2 / 10000).toFixed(2)} ha`
  if (m2 >= 100) return `${Math.round(m2).toLocaleString()} m²`
  return `${m2.toFixed(1)} m²`
}
