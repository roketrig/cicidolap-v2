// src/components/ImagePicker.jsx
//
// Çoklu fotoğraf seçici (en fazla `max`). İlk fotoğraf kapak görseli.
// Öğe biçimi: { key, url }  -> zaten yüklü (düzenleme ekranı)
//             { key, file, preview } -> yeni seçilmiş, henüz yüklenmemiş
import React, { useEffect, useRef } from 'react'
import Icon from './Icon'
import { platform } from '../native'

// Seçilen dosyanın sınırı. Yüklemeden önce ~1600px JPEG'e küçültülüyor
// (bkz. imageUpload.js), Worker'ın 5MB sınırı küçültülmüş dosyaya uygulanır;
// telefon kameraları 5MB'ı rahat aştığı için burada daha geniş tutuluyor.
const MAX_IMAGE_SIZE = 25 * 1024 * 1024
// Android uygulamasının fotoğraf seçicisinde kamera seçeneği yok; ayrı
// "Fotoğraf çek" düğmesi gösteriliyor. (iOS seçicisinde ve mobil tarayıcıda
// kamera zaten seçeneklerden biri.)
const SHOW_CAMERA = platform() === 'android'
let keyCounter = 0
const nextKey = () => `img-${Date.now()}-${keyCounter++}`

export default function ImagePicker({ items, onChange, onError, max = 5 }) {
  const inputRef = useRef(null)
  const cameraRef = useRef(null)
  const previewsRef = useRef(new Set())

  // Yalnızca unmount'ta kalan blob önizlemelerini serbest bırak.
  useEffect(() => {
    const previews = previewsRef.current
    return () => previews.forEach((p) => URL.revokeObjectURL(p))
  }, [])

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const room = max - items.length
    const added = []
    for (const file of files.slice(0, Math.max(room, 0))) {
      if (!file.type.startsWith('image/')) {
        onError?.('Lütfen sadece resim dosyası seç (JPG, PNG, WebP).')
        continue
      }
      if (file.size > MAX_IMAGE_SIZE) {
        onError?.(`"${file.name}" 25MB'dan büyük, atlandı.`)
        continue
      }
      const preview = URL.createObjectURL(file)
      previewsRef.current.add(preview)
      added.push({ key: nextKey(), file, preview })
    }
    if (files.length > room) onError?.(`En fazla ${max} fotoğraf ekleyebilirsin.`)
    else if (added.length) onError?.('')
    if (added.length) onChange([...items, ...added])
  }

  const remove = (key) => {
    const gone = items.find((i) => i.key === key)
    if (gone?.preview) {
      URL.revokeObjectURL(gone.preview)
      previewsRef.current.delete(gone.preview)
    }
    onChange(items.filter((i) => i.key !== key))
  }

  const makeCover = (key) => {
    const it = items.find((i) => i.key === key)
    onChange([it, ...items.filter((i) => i.key !== key)])
  }

  return (
    <div>
      <div className="imgpick-grid">
        {items.map((it, idx) => (
          <div key={it.key} className="imgpick-tile">
            <img src={it.preview || it.url} alt={`Fotoğraf ${idx + 1}`} />
            {idx === 0 && <span className="imgpick-cover">Kapak</span>}
            <button type="button" className="imgpick-remove" onClick={() => remove(it.key)} aria-label="Fotoğrafı kaldır">
              <Icon name="close" size={14} strokeWidth={2.6} />
            </button>
            {idx > 0 && (
              <button type="button" className="imgpick-makecover" onClick={() => makeCover(it.key)}>
                Kapak yap
              </button>
            )}
          </div>
        ))}
        {items.length < max && (
          <button type="button" className="imgpick-add" onClick={() => inputRef.current?.click()}>
            <Icon name={SHOW_CAMERA ? 'image' : 'camera'} size={26} />
            <span>{SHOW_CAMERA ? 'Galeriden seç' : 'Fotoğraf ekle'}</span>
            <small>{items.length}/{max}</small>
          </button>
        )}
        {SHOW_CAMERA && items.length < max && (
          <button type="button" className="imgpick-add" onClick={() => cameraRef.current?.click()}>
            <Icon name="camera" size={26} />
            <span>Fotoğraf çek</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="d-none" />
      {SHOW_CAMERA && (
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFiles} className="d-none" />
      )}
      <small className="text-muted d-block mt-2">
        JPG, PNG, WebP. İlk fotoğraf kapak olarak görünür; net ve aydınlık fotoğraflar daha hızlı ilgi görür.
      </small>
    </div>
  )
}
