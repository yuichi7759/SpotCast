export interface Field {
  id: string
  user_id: string
  name: string
  crop: string | null
  variety: string | null
  planted_at: string | null
  lat: number | null
  lng: number | null
  area_m2: number | null
  polygon: [number, number][] | null
  notes: string | null
  color: string | null   // hex e.g. '#3ecf8e'
  created_at: string
  updated_at: string
}

export interface WeatherCurrent {
  temp: number
  feels_like: number
  humidity: number
  wind_speed: number
  weather_main: string
  weather_icon: string
}

export interface WeatherForecastDay {
  date: string
  temp_max: number
  temp_min: number
  rain_prob: number
  weather_main: string
}

export interface WeatherData {
  city: string
  current: WeatherCurrent
  forecast: WeatherForecastDay[]
}
