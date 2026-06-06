import { Keyboard, X } from 'lucide-react'

interface KeyboardHelpProps {
  show: boolean
  onClose: () => void
}

const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl + S', description: '快速提交办理' },
  { key: 'Ctrl + N', description: '新增办理事项' },
  { key: 'Ctrl + U', description: '上传附件' },
  { key: 'Ctrl + K', description: '显示/隐藏键盘快捷键' },
  { key: 'Esc', description: '关闭弹窗/取消操作' },
  { key: 'Tab', description: '切换输入焦点' },
]

export default function KeyboardHelp({ show, onClose }: KeyboardHelpProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-500" />
            键盘操作快捷键
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto max-h-96">
          {KEYBOARD_SHORTCUTS.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
              <span className="text-sm text-slate-600">{item.description}</span>
              <kbd className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-mono rounded border border-slate-200">
                {item.key}
              </kbd>
            </div>
          ))}
          <div className="pt-3 mt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              提示：使用键盘操作可以提高办理效率。提交前请确保所有附件大小符合要求，过大的附件需要先压缩。
            </p>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}
