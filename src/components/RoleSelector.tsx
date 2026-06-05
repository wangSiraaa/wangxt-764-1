import { useAppStore } from '@/store/useAppStore'
import { ROLE_LABELS, type Role } from '@/types'
import { User, Users, ShieldCheck } from 'lucide-react'

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  teller: <User className="w-8 h-8" />,
  customer: <Users className="w-8 h-8" />,
  supervisor: <ShieldCheck className="w-8 h-8" />,
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  teller: '录入客户信息、上传附件、发起签名、提交办理',
  customer: '查看个人信息、确认签名、查看办理结果',
  supervisor: '审核办理事项、审批/驳回提交、查看全量数据',
}

export default function RoleSelector() {
  const setRole = useAppStore((s) => s.setRole)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">移动柜台办理系统</h1>
          <p className="text-slate-500 mt-2">请选择您的角色身份</p>
        </div>
        <div className="space-y-4">
          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
            <button
              key={role}
              onClick={() => setRole(role)}
              className="w-full bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-4 text-left"
            >
              <div className="text-blue-600">{ROLE_ICONS[role]}</div>
              <div>
                <div className="font-semibold text-slate-800 text-lg">{ROLE_LABELS[role]}</div>
                <div className="text-sm text-slate-500 mt-0.5">{ROLE_DESCRIPTIONS[role]}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
