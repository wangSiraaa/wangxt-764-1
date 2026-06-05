import {
  MAX_ATTACHMENT_SIZE,
  COMPRESS_THRESHOLD,
  type AttachmentPhoto,
  type SignatureData,
  type ProcessingItem,
} from '@/types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateSubmission(
  signature: SignatureData | null,
  attachments: AttachmentPhoto[],
  items: ProcessingItem[],
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!signature || signature.status !== 'signed') {
    errors.push('未签名不能提交：请先完成客户签名')
  }

  if (items.length === 0) {
    errors.push('办理事项不能为空：请至少添加一个办理事项')
  }

  for (const att of attachments) {
    if (att.size > MAX_ATTACHMENT_SIZE) {
      errors.push(`附件"${att.name}"过大(${formatSize(att.size)})，超过5MB限制，请压缩后重新上传`)
    } else if (att.size > COMPRESS_THRESHOLD && !att.compressed) {
      warnings.push(`附件"${att.name}"较大(${formatSize(att.size)})，建议压缩后再提交`)
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function checkAttachmentSize(file: File): { allowed: boolean; warning: string | null } {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return {
      allowed: false,
      warning: `附件"${file.name}"(${formatSize(file.size)})超过5MB限制，请压缩后重新上传`,
    }
  }
  if (file.size > COMPRESS_THRESHOLD) {
    return {
      allowed: true,
      warning: `附件"${file.name}"(${formatSize(file.size)})较大，建议压缩后上传`,
    }
  }
  return { allowed: true, warning: null }
}

export function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let w = img.width
      let h = img.height
      if (w > maxWidth) {
        h = (h * maxWidth) / w
        w = maxWidth
      }
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}
