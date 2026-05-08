import { useCallback, useRef, useState } from 'react'
import { Camera, X, ImagePlus, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface PhotoUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxPhotos?: number
}

function buildStoragePath(userId: string, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeId = crypto.randomUUID()
  return `${userId}/${safeId}.${extension}`
}

export function PhotoUpload({ value, onChange, maxPhotos = 5 }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return
    const remaining = maxPhotos - value.length
    if (remaining <= 0) return

    setUploadError(null)
    setUploading(true)

    const toUpload = Array.from(files).slice(0, remaining)
    const newUrls: string[] = []

    try {
      for (const file of toUpload) {
        const path = buildStoragePath(user.id, file)
        const { error } = await supabase.storage.from('listing-images').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

        if (error) throw error
        const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }

      onChange([...value, ...newUrls])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [maxPhotos, onChange, user, value])

  const removePhoto = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const canAddMore = value.length < maxPhotos

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, index) => (
            <div key={url + index} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
              <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {index === 0 && <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-black/60 text-white rounded px-1.5 py-0.5">Cover</span>}
            </div>
          ))}

          {canAddMore && !uploading && (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 flex flex-col items-center justify-center gap-1 transition-colors">
              <ImagePlus className="w-5 h-5 text-muted-foreground" />
            </button>
          )}

          {uploading && (
            <div className="aspect-square rounded-xl bg-muted flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}
        </div>
      )}

      {value.length === 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !user}
          className={cn(
            'w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
            uploading || !user ? 'border-border bg-muted/30 cursor-not-allowed' : 'border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <Camera className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Tap to add photos</span>
              <span className="text-xs text-muted-foreground/70">JPG, PNG up to 10 MB each</span>
            </>
          )}
        </button>
      )}

      {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

      <p className="text-xs text-muted-foreground">
        {value.length} / {maxPhotos} photos
        {value.length === 0 && ' - Add at least one to help tenants picture the room'}
      </p>

      <input ref={fileInputRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  )
}
