import { useAppStore } from '@/store/useAppStore'
import { ROLE_PERMISSIONS, type SignatureData } from '@/types'
import { PenTool, CheckCircle, AlertCircle } from 'lucide-react'
import { useRef, useState, useCallback } from 'react'

export default function SignaturePanel() {
  const role = useAppStore((s) => s.role)
  const signature = useAppStore((s) => s.signature)
  const setSignature = useAppStore((s) => s.setSignature)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)

  if (!role || !signature) return null

  const canSign = ROLE_PERMISSIONS[role].includes('sign')
  const canRequest = ROLE_PERMISSIONS[role].includes('request_signature')
  const isSigned = signature.status === 'signed'

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canSign || isSigned) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    setDrawing(true)

    let x: number, y: number
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [canSign, isSigned])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')!

    let x: number, y: number
    if ('touches' in e) {
      e.preventDefault()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }
    ctx.lineTo(x, y)
    ctx.stroke()
  }, [drawing])

  const stopDrawing = useCallback(() => {
    if (!drawing) return
    setDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const updated: SignatureData = {
      ...signature,
      status: 'signed',
      dataUrl,
      signedAt: new Date().toISOString(),
    }
    setSignature(updated)
  }, [drawing, signature, setSignature])

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignature({ ...signature, status: 'unsigned', dataUrl: null, signedAt: null })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <PenTool className="w-4 h-4 text-blue-500" />
          客户签名
          {isSigned ? (
            <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />已签名</span>
          ) : (
            <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />未签名</span>
          )}
        </h2>
        {canSign && !isSigned && (
          <span className="text-[10px] text-slate-400">请在下方区域签名</span>
        )}
      </div>

      <div className="p-4">
        {canRequest && !canSign && !isSigned && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
            请将设备交由客户完成签名确认
          </div>
        )}

        {isSigned && signature.dataUrl ? (
          <div className="space-y-2">
            <img src={signature.dataUrl} alt="签名" className="border border-slate-200 rounded w-full h-24 object-contain bg-white" />
            <div className="text-[10px] text-slate-400">签名时间: {signature.signedAt ? new Date(signature.signedAt).toLocaleString('zh-CN') : '-'}</div>
            {canSign && (
              <button onClick={clearSignature} className="text-xs text-red-500 hover:text-red-600">重新签名</button>
            )}
          </div>
        ) : canSign ? (
          <div className="space-y-2">
            <canvas
              ref={canvasRef}
              width={340}
              height={120}
              className="border border-dashed border-slate-300 rounded w-full cursor-crosshair touch-none bg-slate-50/50"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="text-[10px] text-slate-400 text-center">抬笔自动确认签名</div>
          </div>
        ) : (
          <div className="h-24 border border-dashed border-slate-200 rounded flex items-center justify-center text-sm text-slate-400">
            等待客户签名...
          </div>
        )}
      </div>
    </div>
  )
}
