import type { CustomerInfo, ProcessingItem, SignatureData, AttachmentPhoto, SubmissionResult, Role } from '@/types'

export const SAMPLE_CUSTOMERS: CustomerInfo[] = [
  { id: 'cust-001', name: '张三', idCard: '110101199001011234', phone: '13800138001', address: '北京市朝阳区建国路88号' },
  { id: 'cust-002', name: '李四', idCard: '310101198505052345', phone: '13900139002', address: '上海市浦东新区陆家嘴环路1000号' },
  { id: 'cust-003', name: '王五', idCard: '440101199203033456', phone: '13700137003', address: '广州市天河区天河路385号' },
]

export const SAMPLE_ITEMS_BY_ROLE: Record<Role, ProcessingItem[]> = {
  teller: [
    { id: 'item-001', category: '账户开户', description: '个人储蓄账户开户', status: 'processing', createdBy: 'teller' },
    { id: 'item-002', category: '密码重置', description: '借记卡交易密码重置', status: 'pending', createdBy: 'teller' },
    { id: 'item-003', category: '资料变更', description: '客户手机号变更', status: 'completed', createdBy: 'teller' },
  ],
  customer: [
    { id: 'item-001', category: '账户开户', description: '个人储蓄账户开户', status: 'processing', createdBy: 'teller' },
  ],
  supervisor: [
    { id: 'item-001', category: '账户开户', description: '个人储蓄账户开户', status: 'processing', createdBy: 'teller' },
    { id: 'item-002', category: '密码重置', description: '借记卡交易密码重置', status: 'pending', createdBy: 'teller' },
    { id: 'item-003', category: '大额转账', description: '单笔50万以上转账审批', status: 'pending', createdBy: 'teller' },
    { id: 'item-004', category: '资料变更', description: '客户手机号变更', status: 'completed', createdBy: 'teller' },
  ],
}

export const SAMPLE_SIGNATURE_UNSIGNED: SignatureData = {
  customerId: 'cust-001',
  status: 'unsigned',
  dataUrl: null,
  signedAt: null,
}

export const SAMPLE_SIGNATURE_SIGNED: SignatureData = {
  customerId: 'cust-001',
  status: 'signed',
  dataUrl: 'data:image/png;base64,iVBORwkggoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  signedAt: '2026-06-05T10:30:00Z',
}

export const SAMPLE_ATTACHMENTS: AttachmentPhoto[] = [
  { id: 'att-001', name: '身份证正面.jpg', size: 1024 * 800, type: 'image/jpeg', dataUrl: '', compressed: false, originalSize: 1024 * 800 },
  { id: 'att-002', name: '身份证反面.jpg', size: 1024 * 950, type: 'image/jpeg', dataUrl: '', compressed: false, originalSize: 1024 * 950 },
]

export const SAMPLE_LARGE_ATTACHMENT: AttachmentPhoto = {
  id: 'att-003', name: '房产证明.jpg', size: 6 * 1024 * 1024, type: 'image/jpeg', dataUrl: '', compressed: false, originalSize: 6 * 1024 * 1024,
}

export function createSampleSubmission(role: Role, signed: boolean): SubmissionResult {
  return {
    id: 'sub-' + Date.now(),
    ticketNo: 'TK' + String(Date.now()).slice(-8),
    items: SAMPLE_ITEMS_BY_ROLE[role],
    customerInfo: SAMPLE_CUSTOMERS[0],
    signature: signed ? SAMPLE_SIGNATURE_SIGNED : SAMPLE_SIGNATURE_UNSIGNED,
    attachments: SAMPLE_ATTACHMENTS,
    status: 'draft',
    submittedAt: null,
    syncedAt: null,
    submittedBy: role,
  }
}
