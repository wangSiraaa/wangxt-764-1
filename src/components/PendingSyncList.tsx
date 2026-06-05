import { useAppStore } from '@/store/useAppStore'
import { RefreshCw, CloudOff, Trash2 } from 'lucide-react'

export default function PendingSyncList() {
  const pendingSyncList = useAppStore((s) => s.pendingSyncList)
  const isOnline = useAppStore((s) => s.isOnline)
  const syncPendingItems = useAppStore((s) => s.syncPendingItems)

  if (pendingSyncList.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-orange-100 bg-orange-50/50 flex items-center justify-between">
        <h2 className="font-semibold text-orange-700 flex items-center gap-2">
          <CloudOff className="w-4 h-4" />
          待同步列表
          <span className="text-xs font-normal">({pendingSyncList.length})</span>
        </h2>
        {isOnline && (
          <button
            onClick={syncPendingItems}
            className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            立即同步
          </button>
        )}
      </div>
      <div className="divide-y divide-slate-100">
        {pendingSyncList.map((item) => (
          <div key={item.id} className="px-4 py-3 flex items-center gap-3">
            <CloudOff className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-800 font-mono">{item.ticketNo}</div>
              <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString('zh-CN')}</div>
            </div>
            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">待同步</span>
          </div>
        ))}
      </div>
    </div>
  )
}
