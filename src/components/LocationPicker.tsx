import { Crosshair, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LocationPickerProps {
  latitude: number | null
  longitude: number | null
  onChange: (coords: { latitude: number | null; longitude: number | null }) => void
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const hasPin = latitude !== null && longitude !== null

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((position) => {
      onChange({
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
      })
    })
  }

  return (
    <div className="rk-surface overflow-hidden rounded-2xl">
      <div className="relative h-48 bg-[linear-gradient(135deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(225deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(315deg,hsl(var(--muted))_25%,hsl(var(--background))_25%)] bg-[length:28px_28px] bg-[position:14px_0,14px_0,0_0,0_0]">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/10" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center transition-transform duration-200">
          <MapPin className="h-9 w-9 fill-primary text-primary drop-shadow-sm" />
          <span className="mt-1 rounded-full bg-card px-2 py-1 text-[11px] font-semibold shadow-sm">
            {hasPin ? 'Pinned location' : 'Add exact pin'}
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm font-medium">
          Latitude
          <input
            type="number"
            step="0.000001"
            value={latitude ?? ''}
            onChange={(event) => onChange({ latitude: event.target.value ? Number(event.target.value) : null, longitude })}
            className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="-26.2041"
          />
        </label>
        <label className="text-sm font-medium">
          Longitude
          <input
            type="number"
            step="0.000001"
            value={longitude ?? ''}
            onChange={(event) => onChange({ latitude, longitude: event.target.value ? Number(event.target.value) : null })}
            className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="28.0473"
          />
        </label>
        <Button type="button" variant="outline" className="h-11 self-end gap-2 touch-manipulation" onClick={useCurrentLocation}>
          <Crosshair className="h-4 w-4" />
          Use current
        </Button>
      </div>
    </div>
  )
}
