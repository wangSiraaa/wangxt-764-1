import { useAppStore } from '@/store/useAppStore'
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/types'
import type { Role } from '@/types'
import { LogOut, Wifi, WifiOff } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const role = useAppStore((s) => s.role)
  const isOnline = useAppStore((s) => s.isOnline)
  const pendingSyncList = useAppStore((s) => s.pendingSyncList)
  const reset = useAppStore((s) => s.reset)

  if (!role) return null

  const permissions = ROLE_PERMISSIONS[role]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-medium">
              {ROLE_LABELS[role]}
            </span>
            <span className="text-slate-700 font-medium text-sm">移动柜台</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs">
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={isOnline ? 'text-green-600' : 'text-red-500'}>
                {isOnline ? '在线' : '离线'}
              </span>
              {!isOnline && pendingSyncList.length > 0 && (
                <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] ml-1">
                  {pendingSyncList.length}
                </span>
              )}
            </div>
            <button onClick={reset} className="text-slate-400 hover:text-slate-600">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {permissions.map((p) => (
            <span key={p} className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded">
              {p}
            </span>
          ))}
        </div>
        {children}
      </div>
    </div>
  )
}
