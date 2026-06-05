import { useAppStore } from '@/store/useAppStore'
import { ROLE_PERMISSIONS, type ProcessingItem } from '@/types'
import { ClipboardList, Plus, Trash2, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const STATUS_LABELS: Record<ProcessingItem['status'], { text: string; color: string }> = {
  pending: { text: '待处理', color: 'bg-yellow-100 text-yellow-700' },
  processing: { text: '处理中', color: 'bg-blue-100 text-blue-700' },
  completed: { text: '已完成', color: 'bg-green-100 text-green-700' },
}

const ITEM_CATEGORIES = ['账户开户', '密码重置', '资料变更', '大额转账', '卡片挂失', '网银开通']

export default function ProcessingItemsPanel() {
  const role = useAppStore((s) => s.role)
  const processingItems = useAppStore((s) => s.processingItems)
  const addProcessingItem = useAppStore((s) => s.addProcessingItem)
  const removeProcessingItem = useAppStore((s) => s.removeProcessingItem)
  const updateProcessingItemStatus = useAppStore((s) => s.updateProcessingItemStatus)
  const [adding, setAdding] = useState(false)
  const [newCategory, setNewCategory] = useState(ITEM_CATEGORIES[0])
  const [newDesc, setNewDesc] = useState('')

  if (!role) return null

  const canAdd = ROLE_PERMISSIONS[role].includes('add_item')
  const canRemove = ROLE_PERMISSIONS[role].includes('remove_item')
  const canApprove = ROLE_PERMISSIONS[role].includes('approve')

  const handleAdd = () => {
    if (!newDesc.trim()) return
    addProcessingItem({
      id: 'item-' + Date.now(),
      category: newCategory,
      description: newDesc.trim(),
      status: 'pending',
      createdBy: role,
    })
    setNewDesc('')
    setAdding(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          办理事项
          <span className="text-xs text-slate-400 font-normal">({processingItems.length})</span>
        </h2>
        {canAdd && (
          <button
            onClick={() => setAdding(!adding)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            添加
          </button>
        )}
      </div>

      {adding && (
        <div className="px-4 py-3 border-b border-slate-100 bg-blue-50/50 space-y-2">
          <select
            className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            {ITEM_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
            placeholder="事项描述"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">确认添加</button>
            <button onClick={() => setAdding(false)} className="text-xs text-slate-500 px-3 py-1">取消</button>
          </div>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {processingItems.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">暂无办理事项</div>
        )}
        {processingItems.map((item) => {
          const st = STATUS_LABELS[item.status]
          return (
            <div key={item.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{item.category}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${st.color}`}>{st.text}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</div>
              </div>
              {canApprove && item.status === 'pending' && (
                <button
                  onClick={() => updateProcessingItemStatus(item.id, 'completed')}
                  className="text-xs text-green-600 hover:text-green-700 flex items-center gap-0.5 shrink-0"
                >
                  审批通过
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
              {canRemove && item.status !== 'completed' && (
                <button
                  onClick={() => removeProcessingItem(item.id)}
                  className="text-slate-300 hover:text-red-500 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
