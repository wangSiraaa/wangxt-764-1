export type Role = 'teller' | 'customer' | 'supervisor'

export const ROLE_LABELS: Record<Role, string> = {
  teller: '柜员',
  customer: '客户',
  supervisor: '现场主管',
}

export interface CustomerInfo {
  id: string
  name: string
  idCard: string
  phone: string
  address: string
}

export interface ProcessingItem {
  id: string
  category: string
  description: string
  status: 'pending' | 'processing' | 'completed'
  createdBy: Role
}

export type SignatureStatus = 'unsigned' | 'signed'

export interface SignatureData {
  customerId: string
  status: SignatureStatus
  dataUrl: string | null
  signedAt: string | null
}

export interface AttachmentPhoto {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
  compressed: boolean
  originalSize: number
}

export type SubmissionStatus = 'draft' | 'submitted' | 'synced' | 'failed'

export interface SubmissionResult {
  id: string
  ticketNo: string
  items: ProcessingItem[]
  customerInfo: CustomerInfo
  signature: SignatureData
  attachments: AttachmentPhoto[]
  status: SubmissionStatus
  submittedAt: string | null
  syncedAt: string | null
  submittedBy: Role
}

export interface PendingSyncItem {
  id: string
  submissionId: string
  ticketNo: string
  createdAt: string
  payload: SubmissionResult
}

export interface AppState {
  role: Role | null
  customerInfo: CustomerInfo | null
  processingItems: ProcessingItem[]
  signature: SignatureData | null
  attachments: AttachmentPhoto[]
  submissions: SubmissionResult[]
  pendingSyncList: PendingSyncItem[]
  isOnline: boolean
  submissionResult: SubmissionResult | null
  validationErrors: string[]
}

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024
export const COMPRESS_THRESHOLD = 3 * 1024 * 1024

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  teller: ['view_customer', 'edit_customer', 'add_item', 'remove_item', 'request_signature', 'upload_attachment', 'submit', 'view_result'],
  customer: ['view_customer', 'sign', 'view_result'],
  supervisor: ['view_customer', 'view_items', 'approve', 'reject', 'view_result'],
}
