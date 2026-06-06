import { useAppStore } from '@/store/useAppStore'
import { ROLE_PERMISSIONS, MAX_ATTACHMENT_SIZE } from '@/types'
import Layout from '@/components/Layout'
import CustomerInfoPanel from '@/components/CustomerInfoPanel'
import ProcessingItemsPanel from '@/components/ProcessingItemsPanel'
import SignaturePanel from '@/components/SignaturePanel'
import AttachmentPanel from '@/components/AttachmentPanel'
import SubmissionResultPanel from '@/components/SubmissionResultPanel'
import PendingSyncList from '@/components/PendingSyncList'
import KeyboardHelp from '@/components/KeyboardHelp'
import { Send, Wifi, WifiOff, AlertTriangle, CheckCircle, Keyboard } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function CounterPage() {
  const role = useAppStore((s) => s.role)
  const isOnline = useAppStore((s) => s.isOnline)
  const setOnline = useAppStore((s) => s.setOnline)
  const signature = useAppStore((s) => s.signature)
  const validateAndSubmit = useAppStore((s) => s.validateAndSubmit)
  const currentSubmission = useAppStore((s) => s.currentSubmission)
  const validationErrors = useAppStore((s) => s.validationErrors)
  const validationWarnings = useAppStore((s) => s.validationWarnings)
  const attachments = useAppStore((s) => s.attachments)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault()
            if (canSubmit) {
              handleSubmit()
            }
            break
          case 'k':
            e.preventDefault()
            setShowKeyboardHelp((prev) => !prev)
            break
          case 'u':
            e.preventDefault()
            if (ROLE_PERMISSIONS[role!]?.includes('upload_attachment')) {
              fileInputRef.current?.click()
            }
            break
        }
      }
      if (e.key === 'Escape') {
        setShowKeyboardHelp(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canSubmit, role])

  const checkLargeAttachments = (): string[] => {
    const issues: string[] = []
    for (const att of attachments) {
      if (att.size > MAX_ATTACHMENT_SIZE) {
        issues.push(`附件"${att.name}"过大，超过5MB限制，请先压缩后再进行状态变更`)
      }
    }
    return issues
  }

  if (!role) return null

  const canSubmit = ROLE_PERMISSIONS[role].includes('submit')
  const canSign = ROLE_PERMISSIONS[role].includes('sign')
  const canApprove = ROLE_PERMISSIONS[role].includes('approve')

  const handleSubmit = () => {
    setSubmitAttempted(true)
    const attachmentIssues = checkLargeAttachments()
    if (attachmentIssues.length > 0) {
      return
    }
    const result = validateAndSubmit()
    if (result.success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }

  const toggleNetwork = () => {
    setOnline(!isOnline)
  }

  return (
    <Layout>
      <div className="space-y-4 pb-8">
        <PendingSyncList />
        <CustomerInfoPanel />
        <ProcessingItemsPanel />

        {(canSign || canApprove || ROLE_PERMISSIONS[role].includes('request_signature')) && (
          <SignaturePanel />
        )}

        {ROLE_PERMISSIONS[role].includes('upload_attachment') && (
          <AttachmentPanel />
        )}

        {submitAttempted && validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
            {validationErrors.map((err, i) => (
              <div key={i} className="text-sm text-red-600 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {err}
              </div>
            ))}
          </div>
        )}

        {validationWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-1">
            {validationWarnings.map((w, i) => (
              <div key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {w}
              </div>
            ))}
          </div>
        )}

        {canSubmit && (
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isOnline ? '提交办理' : '离线提交（加入待同步）'}
          </button>
        )}

        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-sm font-medium text-green-700">提交成功</div>
              <div className="text-xs text-green-600">
                工单号: {currentSubmission?.ticketNo}
                {!isOnline && ' (离线模式，恢复网络后自动同步)'}
              </div>
            </div>
          </div>
        )}

        <SubmissionResultPanel />

        <div className="pt-2">
          <button
            onClick={toggleNetwork}
            className={`w-full py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 ${
              isOnline
                ? 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100'
                : 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100'
            }`}
          >
            {isOnline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            {isOnline ? '模拟断网（测试离线提交）' : '模拟恢复网络（测试同步）'}
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="w-full py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors"
          >
            <Keyboard className="w-3.5 h-3.5" />
            键盘操作 (Ctrl+K)
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" />
      <KeyboardHelp show={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />
    </Layout>
  )
}
