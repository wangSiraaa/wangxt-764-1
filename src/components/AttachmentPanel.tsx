import { useAppStore } from '@/store/useAppStore'
import { ROLE_PERMISSIONS, MAX_ATTACHMENT_SIZE } from '@/types'
import { checkAttachmentSize, compressImage } from '@/lib/validators'
import { Paperclip, Upload, X, AlertTriangle, FileImage } from 'lucide-react'
import { useRef, useState } from 'react'

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

export default function AttachmentPanel() {
  const role = useAppStore((s) => s.role)
  const attachments = useAppStore((s) => s.attachments)
  const addAttachment = useAppStore((s) => s.addAttachment)
  const removeAttachment = useAppStore((s) => s.removeAttachment)
  const compressAttachment = useAppStore((s) => s.compressAttachment)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [compressing, setCompressing] = useState<string | null>(null)

  if (!role) return null

  const canUpload = ROLE_PERMISSIONS[role].includes('upload_attachment')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setWarning(null)
    setError(null)

    for (const file of Array.from(files)) {
      const check = checkAttachmentSize(file)
      if (!check.allowed) {
        setError(check.warning!)
        continue
      }
      if (check.warning) {
        setWarning(check.warning)
      }

      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      const att = {
        id: 'att-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        compressed: false,
        originalSize: file.size,
      }
      addAttachment(att)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCompress = async (id: string) => {
    const att = attachments.find((a) => a.id === id)
    if (!att || !att.dataUrl) return
    setCompressing(id)
    try {
      const compressed = await compressImage(att.dataUrl)
      const newSize = Math.round((compressed.length * 3) / 4)
      compressAttachment(id, compressed, newSize)
    } finally {
      setCompressing(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-blue-500" />
          附件照片
          <span className="text-xs text-slate-400 font-normal">({attachments.length})</span>
        </h2>
        {canUpload && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            上传
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 text-xs text-red-600">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}
      {warning && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2 text-xs text-yellow-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {warning}
          <button onClick={() => setWarning(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {attachments.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">暂无附件</div>
        )}
        {attachments.map((att) => (
          <div key={att.id} className="px-4 py-3 flex items-center gap-3">
            <FileImage className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-800 truncate flex items-center gap-2">
                {att.name}
                {att.compressed && <span className="text-[10px] bg-green-100 text-green-600 px-1 rounded">已压缩</span>}
              </div>
              <div className="text-xs text-slate-400">
                {formatSize(att.size)}
                {att.compressed && <span className="text-green-500"> (原{formatSize(att.originalSize)})</span>}
              </div>
            </div>
            {canUpload && att.size > MAX_ATTACHMENT_SIZE * 0.5 && !att.compressed && (
              <button
                onClick={() => handleCompress(att.id)}
                disabled={compressing === att.id}
                className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50 shrink-0"
              >
                {compressing === att.id ? '压缩中...' : '压缩'}
              </button>
            )}
            {canUpload && (
              <button onClick={() => removeAttachment(att.id)} className="text-slate-300 hover:text-red-500 shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
