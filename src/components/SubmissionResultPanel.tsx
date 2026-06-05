import { useAppStore } from '@/store/useAppStore'
import { ROLE_PERMISSIONS, ROLE_LABELS, type SubmissionResult } from '@/types'
import { CheckCircle, XCircle, Clock, Send, RefreshCw } from 'lucide-react'

const STATUS_CONFIG: Record<SubmissionResult['status'], { text: string; color: string; icon: React.ReactNode }> = {
  draft: { text: '草稿', color: 'text-slate-500', icon: <Clock className="w-4 h-4" /> },
  submitted: { text: '已提交', color: 'text-blue-600', icon: <Send className="w-4 h-4" /> },
  synced: { text: '已同步/已审批', color: 'text-green-600', icon: <CheckCircle className="w-4 h-4" /> },
  failed: { text: '已驳回', color: 'text-red-500', icon: <XCircle className="w-4 h-4" /> },
}

export default function SubmissionResultPanel() {
  const role = useAppStore((s) => s.role)
  const submissions = useAppStore((s) => s.submissions)
  const currentSubmission = useAppStore((s) => s.currentSubmission)
  const approveSubmission = useAppStore((s) => s.approveSubmission)
  const rejectSubmission = useAppStore((s) => s.rejectSubmission)

  if (!role) return null

  const canApprove = ROLE_PERMISSIONS[role].includes('approve')
  const canReject = ROLE_PERMISSIONS[role].includes('reject')
  const displaySub = currentSubmission ? [currentSubmission, ...submissions.filter((s) => s.id !== currentSubmission.id)] : submissions

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-500" />
          提交结果
        </h2>
      </div>

      {displaySub.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-400">暂无提交记录</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {displaySub.map((sub) => {
            const cfg = STATUS_CONFIG[sub.status]
            return (
              <div key={sub.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-slate-800">{sub.ticketNo}</span>
                  <span className={`text-xs flex items-center gap-1 ${cfg.color}`}>
                    {cfg.icon} {cfg.text}
                  </span>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <div>客户: {sub.customerInfo.name} | 事项: {sub.items.map((i) => i.category).join('、')}</div>
                  <div>签名: {sub.signature.status === 'signed' ? '✓ 已签名' : '✗ 未签名'} | 附件: {sub.attachments.length}份</div>
                  <div>提交人: {ROLE_LABELS[sub.submittedBy]} | 提交时间: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('zh-CN') : '-'}</div>
                  {sub.syncedAt && <div>同步时间: {new Date(sub.syncedAt).toLocaleString('zh-CN')}</div>}
                </div>
                {canApprove && sub.status === 'submitted' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => approveSubmission(sub.id)}
                      className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> 审批通过
                    </button>
                    <button
                      onClick={() => rejectSubmission(sub.id)}
                      className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded hover:bg-red-100 flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> 驳回
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
