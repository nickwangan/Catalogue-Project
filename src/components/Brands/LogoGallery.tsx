import { useState, useRef } from 'react'
import { BrandLogo } from '../../lib/supabase'
import { useUploadLogos, useDeleteLogo } from '../../hooks/useLogos'
import { useToast } from '../../context/ToastContext'

type Props = {
  brandId: string
  logos: BrandLogo[]
  canEdit: boolean
  username: string
}

export function LogoGallery({ brandId, logos, canEdit, username }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadLogos = useUploadLogos()
  const deleteLogo = useDeleteLogo()
  const { showToast } = useToast()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return
    try {
      await uploadLogos.mutateAsync({ brandId, files, username })
      showToast(`${files.length} image${files.length === 1 ? '' : 's'} added`)
    } catch (err) {
      showToast(
        'Upload failed: ' + (err instanceof Error ? err.message : 'Unknown'),
        'error',
      )
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    const logo = logos[activeIdx]
    if (!logo) return
    if (!window.confirm('Remove this logo?')) return
    try {
      await deleteLogo.mutateAsync({ logo, username })
      setActiveIdx(0)
      showToast('Image removed')
    } catch (err) {
      showToast(
        'Delete failed: ' + (err instanceof Error ? err.message : 'Unknown'),
        'error',
      )
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Brand Images</h3>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLogos.isPending}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1.5 rounded-lg"
            >
              {uploadLogos.isPending ? 'Uploading…' : '+ Add Image(s)'}
            </button>
            {logos.length > 0 && (
              <button
                onClick={handleDelete}
                disabled={deleteLogo.isPending}
                className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg"
              >
                Remove Current
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        )}
      </div>

      {logos.length === 0 ? (
        <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
          No images uploaded yet
        </div>
      ) : (
        <div>
          <div className="w-full h-56 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={logos[activeIdx].image_url}
              alt={`Logo ${activeIdx + 1}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          {logos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {logos.map((logo, idx) => (
                <button
                  key={logo.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                    idx === activeIdx ? 'border-indigo-600' : 'border-gray-200'
                  }`}
                >
                  <img src={logo.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
