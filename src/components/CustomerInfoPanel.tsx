import { useAppStore } from '@/store/useAppStore'
import { ROLE_PERMISSIONS } from '@/types'
import { User, Phone, CreditCard, MapPin, Pencil } from 'lucide-react'
import { useState } from 'react'

export default function CustomerInfoPanel() {
  const role = useAppStore((s) => s.role)
  const customerInfo = useAppStore((s) => s.customerInfo)
  const updateCustomerInfo = useAppStore((s) => s.updateCustomerInfo)
  const [editing, setEditing] = useState(false)

  if (!customerInfo || !role) return null

  const canEdit = ROLE_PERMISSIONS[role].includes('edit_customer')

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-500" />
          客户信息
        </h2>
        {canEdit && (
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Pencil className="w-3 h-3" />
            {editing ? '完成' : '编辑'}
          </button>
        )}
      </div>
      <div className="p-4 space-y-3">
        <InfoRow icon={<User className="w-4 h-4 text-slate-400" />} label="姓名" value={customerInfo.name} field="name" editing={editing && canEdit} onChange={(v) => updateCustomerInfo({ name: v })} />
        <InfoRow icon={<CreditCard className="w-4 h-4 text-slate-400" />} label="身份证" value={customerInfo.idCard} field="idCard" editing={editing && canEdit} onChange={(v) => updateCustomerInfo({ idCard: v })} />
        <InfoRow icon={<Phone className="w-4 h-4 text-slate-400" />} label="手机号" value={customerInfo.phone} field="phone" editing={editing && canEdit} onChange={(v) => updateCustomerInfo({ phone: v })} />
        <InfoRow icon={<MapPin className="w-4 h-4 text-slate-400" />} label="地址" value={customerInfo.address} field="address" editing={editing && canEdit} onChange={(v) => updateCustomerInfo({ address: v })} />
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, editing, onChange }: { icon: React.ReactNode; label: string; value: string; field: string; editing: boolean; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm text-slate-500 w-14 shrink-0">{label}</span>
      {editing ? (
        <input
          className="flex-1 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <span className="text-sm text-slate-800">{value}</span>
      )}
    </div>
  )
}
