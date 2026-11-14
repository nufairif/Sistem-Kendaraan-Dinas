import type { VehicleDocument, VehiclePhoto } from '../types/bmd'

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_PDF_BYTES = 1.5 * 1024 * 1024 // 1.5 MB untuk penyimpanan lokal
const MAX_DIMENSION = 960

function isAllowedImageFile(file: File): boolean {
  if (ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return true
  }
  const lower = file.name.toLowerCase()
  return ALLOWED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function isPdfFile(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  )
}

function toWebpFileName(originalName: string): string {
  const base = originalName.replace(/\.[^/.]+$/, '').trim() || 'gambar'
  return `${base}.webp`
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Gagal membaca file.'))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file.'))
    reader.readAsDataURL(file)
  })
}

async function convertImageDataUrlToWebp(dataUrl: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('File gambar tidak valid atau rusak.'))
    image.src = dataUrl
  })

  let targetWidth = img.width
  let targetHeight = img.height

  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth)
      targetWidth = MAX_DIMENSION
    } else {
      targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight)
      targetHeight = MAX_DIMENSION
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Browser tidak mendukung pemrosesan kanvas gambar ke WebP.')
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
  const webpDataUrl = canvas.toDataURL('image/webp', 0.8)
  if (!webpDataUrl.startsWith('data:image/webp')) {
    throw new Error('Browser Anda tidak mendukung konversi gambar ke format WebP.')
  }
  return webpDataUrl
}

export async function compressVehicleImage(file: File): Promise<VehiclePhoto> {
  if (!isAllowedImageFile(file)) {
    throw new Error('Format foto harus berupa JPG, JPEG, PNG, atau WebP.')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Ukuran file foto maksimal 5 MB.')
  }

  const rawDataUrl = await readFileAsDataUrl(file)
  const webpDataUrl = await convertImageDataUrlToWebp(rawDataUrl)

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: toWebpFileName(file.name),
    dataUrl: webpDataUrl,
  }
}

export async function readVehicleDocument(
  file: File,
  labelDokumen: string
): Promise<VehicleDocument> {
  const isPdf = isPdfFile(file)
  const isImage = isAllowedImageFile(file)

  if (!ALLOWED_DOC_TYPES.includes(file.type.toLowerCase()) && !isPdf && !isImage) {
    throw new Error(
      `Dokumen ${labelDokumen} harus berupa PDF, JPG, JPEG, PNG, atau WebP.`
    )
  }

  if (isPdf) {
    if (file.size > MAX_PDF_BYTES) {
      throw new Error(
        `Ukuran PDF ${labelDokumen} maksimal 1,5 MB agar dapat disimpan di penyimpanan browser.`
      )
    }
    const dataUrl = await readFileAsDataUrl(file)
    return {
      fileName: file.name,
      mimeType: 'application/pdf',
      dataUrl,
      uploadedAt: new Date().toISOString(),
    }
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Ukuran gambar ${labelDokumen} maksimal 5 MB.`)
  }
  const rawDataUrl = await readFileAsDataUrl(file)
  const webpDataUrl = await convertImageDataUrlToWebp(rawDataUrl)
  return {
    fileName: toWebpFileName(file.name),
    mimeType: 'image/webp',
    dataUrl: webpDataUrl,
    uploadedAt: new Date().toISOString(),
  }
}
