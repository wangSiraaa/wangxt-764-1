import { create } from 'zustand'
import type {
  Role,
  CustomerInfo,
  ProcessingItem,
  SignatureData,
  AttachmentPhoto,
  SubmissionResult,
  PendingSyncItem,
} from '@/types'
import { validateSubmission } from '@/lib/validators'
import { addPendingSync, removePendingSync, getAllPendingSync, saveSubmission, getAllSubmissions } from '@/lib/db'
import { SAMPLE_CUSTOMERS, SAMPLE_ITEMS_BY_ROLE, SAMPLE_SIGNATURE_UNSIGNED, SAMPLE_ATTACHMENTS } from '@/data/sampleData'

interface AppStore {
  role: Role | null
  customerInfo: CustomerInfo | null
  processingItems: ProcessingItem[]
  signature: SignatureData | null
  attachments: AttachmentPhoto[]
  submissions: SubmissionResult[]
  pendingSyncList: PendingSyncItem[]
  isOnline: boolean
  currentSubmission: SubmissionResult | null
  validationErrors: string[]
  validationWarnings: string[]

  setRole: (role: Role) => void
  loadSampleData: () => void
  updateCustomerInfo: (info: Partial<CustomerInfo>) => void
  addProcessingItem: (item: ProcessingItem) => void
  removeProcessingItem: (id: string) => void
  updateProcessingItemStatus: (id: string, status: ProcessingItem['status']) => void
  setSignature: (signature: SignatureData) => void
  addAttachment: (att: AttachmentPhoto) => void
  removeAttachment: (id: string) => void
  compressAttachment: (id: string, compressedDataUrl: string, newSize: number) => void
  setOnline: (online: boolean) => void
  validateAndSubmit: () => { success: boolean; errors: string[]; warnings: string[] }
  syncPendingItems: () => Promise<void>
  loadPersistedData: () => Promise<void>
  approveSubmission: (id: string) => void
  rejectSubmission: (id: string) => void
  reset: () => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  role: null,
  customerInfo: null,
  processingItems: [],
  signature: null,
  attachments: [],
  submissions: [],
  pendingSyncList: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  currentSubmission: null,
  validationErrors: [],
  validationWarnings: [],

  setRole: (role) => {
    set({ role })
    get().loadSampleData()
  },

  loadSampleData: () => {
    const role = get().role
    if (!role) return
    set((s) => ({
      customerInfo: { ...SAMPLE_CUSTOMERS[0] },
      processingItems: SAMPLE_ITEMS_BY_ROLE[role].map((i) => ({ ...i })),
      signature: { ...SAMPLE_SIGNATURE_UNSIGNED },
      attachments: SAMPLE_ATTACHMENTS.map((a) => ({ ...a })),
      currentSubmission: null,
      validationErrors: [],
      validationWarnings: [],
    }))
  },

  updateCustomerInfo: (info) => {
    const current = get().customerInfo
    if (!current) return
    set({ customerInfo: { ...current, ...info } })
  },

  addProcessingItem: (item) => {
    set((s) => ({ processingItems: [...s.processingItems, item] }))
  },

  removeProcessingItem: (id) => {
    set((s) => ({ processingItems: s.processingItems.filter((i) => i.id !== id) }))
  },

  updateProcessingItemStatus: (id, status) => {
    set((s) => ({
      processingItems: s.processingItems.map((i) => (i.id === id ? { ...i, status } : i)),
    }))
  },

  setSignature: (signature) => {
    set({ signature })
  },

  addAttachment: (att) => {
    set((s) => ({ attachments: [...s.attachments, att] }))
  },

  removeAttachment: (id) => {
    set((s) => ({ attachments: s.attachments.filter((a) => a.id !== id) }))
  },

  compressAttachment: (id, compressedDataUrl, newSize) => {
    set((s) => ({
      attachments: s.attachments.map((a) =>
        a.id === id ? { ...a, dataUrl: compressedDataUrl, size: newSize, compressed: true } : a,
      ),
    }))
  },

  setOnline: (online) => {
    set({ isOnline: online })
  },

  validateAndSubmit: () => {
    const { signature, attachments, processingItems, role, customerInfo, isOnline } = get()
    const result = validateSubmission(signature, attachments, processingItems)

    if (!result.valid) {
      set({ validationErrors: result.errors, validationWarnings: result.warnings })
      return { success: false, errors: result.errors, warnings: result.warnings }
    }

    const submission: SubmissionResult = {
      id: 'sub-' + Date.now(),
      ticketNo: 'TK' + String(Date.now()).slice(-8),
      items: processingItems.map((i) => ({ ...i })),
      customerInfo: customerInfo!,
      signature: signature!,
      attachments: attachments.map((a) => ({ ...a })),
      status: isOnline ? 'submitted' : 'submitted',
      submittedAt: new Date().toISOString(),
      syncedAt: isOnline ? new Date().toISOString() : null,
      submittedBy: role!,
    }

    if (!isOnline) {
      const pendingItem: PendingSyncItem = {
        id: 'ps-' + Date.now(),
        submissionId: submission.id,
        ticketNo: submission.ticketNo,
        createdAt: new Date().toISOString(),
        payload: submission,
      }
      addPendingSync(pendingItem)
      set((s) => ({
        pendingSyncList: [...s.pendingSyncList, pendingItem],
        submissions: [...s.submissions, submission],
        currentSubmission: submission,
        validationErrors: [],
        validationWarnings: result.warnings,
      }))
    } else {
      saveSubmission(submission)
      set((s) => ({
        submissions: [...s.submissions, submission],
        currentSubmission: submission,
        validationErrors: [],
        validationWarnings: result.warnings,
      }))
    }

    return { success: true, errors: [], warnings: result.warnings }
  },

  syncPendingItems: async () => {
    const pending = await getAllPendingSync()
    for (const item of pending) {
      const updated: SubmissionResult = { ...item.payload, status: 'synced', syncedAt: new Date().toISOString() }
      await saveSubmission(updated)
      await removePendingSync(item.id)
    }
    const remaining = await getAllPendingSync()
    const allSubs = await getAllSubmissions()
    set({ pendingSyncList: remaining, submissions: allSubs })
  },

  loadPersistedData: async () => {
    const pending = await getAllPendingSync()
    const subs = await getAllSubmissions()
    set({ pendingSyncList: pending, submissions: subs })
  },

  approveSubmission: (id) => {
    set((s) => ({
      submissions: s.submissions.map((sub) =>
        sub.id === id ? { ...sub, status: 'synced' as const } : sub,
      ),
      processingItems: s.processingItems.map((i) => ({ ...i, status: 'completed' as const })),
    }))
  },

  rejectSubmission: (id) => {
    set((s) => ({
      submissions: s.submissions.map((sub) =>
        sub.id === id ? { ...sub, status: 'failed' as const } : sub,
      ),
    }))
  },

  reset: () => {
    set({
      role: null,
      customerInfo: null,
      processingItems: [],
      signature: null,
      attachments: [],
      submissions: [],
      pendingSyncList: [],
      currentSubmission: null,
      validationErrors: [],
      validationWarnings: [],
    })
  },
}))
