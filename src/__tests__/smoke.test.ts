import 'fake-indexeddb/auto'
import { validateSubmission, checkAttachmentSize } from '@/lib/validators'
import type { SignatureData, AttachmentPhoto, ProcessingItem } from '@/types'
import { describe, expect, it, beforeEach } from 'vitest'

const SIGNED_SIGNATURE: SignatureData = {
  customerId: 'cust-test',
  status: 'signed',
  dataUrl: 'data:image/png;base64,test',
  signedAt: '2026-06-05T10:00:00Z',
}

const UNSIGNED_SIGNATURE: SignatureData = {
  customerId: 'cust-test',
  status: 'unsigned',
  dataUrl: null,
  signedAt: null,
}

const SAMPLE_ITEMS: ProcessingItem[] = [
  { id: 'item-1', category: '账户开户', description: '个人储蓄账户开户', status: 'pending', createdBy: 'teller' },
]

const SMALL_ATTACHMENT: AttachmentPhoto = {
  id: 'att-1', name: 'id_front.jpg', size: 800 * 1024, type: 'image/jpeg', dataUrl: '', compressed: false, originalSize: 800 * 1024,
}

const LARGE_ATTACHMENT: AttachmentPhoto = {
  id: 'att-2', name: 'property.jpg', size: 6 * 1024 * 1024, type: 'image/jpeg', dataUrl: '', compressed: false, originalSize: 6 * 1024 * 1024,
}

describe('业务规则拦截', () => {
  it('未签名不能提交', () => {
    const result = validateSubmission(UNSIGNED_SIGNATURE, [SMALL_ATTACHMENT], SAMPLE_ITEMS)
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('未签名不能提交')])
    )
  })

  it('已签名可以提交', () => {
    const result = validateSubmission(SIGNED_SIGNATURE, [SMALL_ATTACHMENT], SAMPLE_ITEMS)
    expect(result.valid).toBe(true)
  })

  it('附件过大应报错', () => {
    const result = validateSubmission(SIGNED_SIGNATURE, [LARGE_ATTACHMENT], SAMPLE_ITEMS)
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('过大')])
    )
  })

  it('附件较大应警告', () => {
    const mediumAtt: AttachmentPhoto = {
      id: 'att-3', name: 'doc.jpg', size: 4 * 1024 * 1024, type: 'image/jpeg', dataUrl: '', compressed: false, originalSize: 4 * 1024 * 1024,
    }
    const result = validateSubmission(SIGNED_SIGNATURE, [mediumAtt], SAMPLE_ITEMS)
    expect(result.valid).toBe(true)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('办理事项为空不能提交', () => {
    const result = validateSubmission(SIGNED_SIGNATURE, [SMALL_ATTACHMENT], [])
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('办理事项不能为空')])
    )
  })
})

describe('附件大小检查', () => {
  it('超大文件不允许', () => {
    const file = new File(['x'.repeat(100)], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 })
    const result = checkAttachmentSize(file)
    expect(result.allowed).toBe(false)
    expect(result.warning).toContain('超过5MB限制')
  })

  it('正常大小文件允许', () => {
    const file = new File(['x'], 'small.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 1024 })
    const result = checkAttachmentSize(file)
    expect(result.allowed).toBe(true)
    expect(result.warning).toBeNull()
  })
})

describe('模拟离线提交并验证待同步列表增加', () => {
  beforeEach(async () => {
    const { useAppStore } = await import('@/store/useAppStore')
    const { resetDBInstance } = await import('@/lib/db')
    resetDBInstance()
    useAppStore.getState().reset()
  })

  it('离线提交后待同步列表应增加一条', async () => {
    const { useAppStore } = await import('@/store/useAppStore')
    const { getAllPendingSync, clearAllData } = await import('@/lib/db')

    await clearAllData()

    useAppStore.getState().setOnline(false)
    expect(useAppStore.getState().isOnline).toBe(false)

    useAppStore.getState().setRole('teller')
    expect(useAppStore.getState().role).toBe('teller')
    expect(useAppStore.getState().processingItems.length).toBeGreaterThan(0)

    const beforeCount = useAppStore.getState().pendingSyncList.length

    useAppStore.getState().setSignature(SIGNED_SIGNATURE)
    expect(useAppStore.getState().signature?.status).toBe('signed')

    const result = useAppStore.getState().validateAndSubmit()
    expect(result.success).toBe(true)

    const afterCount = useAppStore.getState().pendingSyncList.length
    expect(afterCount).toBe(beforeCount + 1)

    const latest = useAppStore.getState().pendingSyncList[afterCount - 1]
    expect(latest.ticketNo).toMatch(/^TK/)
    expect(latest.payload.signature.status).toBe('signed')
    expect(latest.payload.status).toBe('submitted')

    const persisted = await getAllPendingSync()
    expect(persisted.length).toBe(afterCount)

    await clearAllData()
  })

  it('恢复网络后同步待同步列表应清空', async () => {
    const { useAppStore } = await import('@/store/useAppStore')
    const { clearAllData, getAllPendingSync, resetDBInstance } = await import('@/lib/db')

    resetDBInstance()
    await clearAllData()

    useAppStore.getState().setOnline(false)
    useAppStore.getState().setRole('teller')
    useAppStore.getState().setSignature(SIGNED_SIGNATURE)
    useAppStore.getState().validateAndSubmit()

    expect(useAppStore.getState().pendingSyncList.length).toBe(1)

    useAppStore.getState().setOnline(true)
    await useAppStore.getState().syncPendingItems()

    expect(useAppStore.getState().pendingSyncList.length).toBe(0)

    const persisted = await getAllPendingSync()
    expect(persisted.length).toBe(0)

    await clearAllData()
  })

  it('客户签名后切回柜员，签名状态保留并能成功离线提交到待同步列表', async () => {
    const { useAppStore } = await import('@/store/useAppStore')
    const { getAllPendingSync, clearAllData, resetDBInstance } = await import('@/lib/db')

    resetDBInstance()
    await clearAllData()

    useAppStore.getState().setOnline(false)

    useAppStore.getState().setRole('teller')
    expect(useAppStore.getState().role).toBe('teller')
    expect(useAppStore.getState().signature?.status).toBe('unsigned')
    expect(useAppStore.getState().processingItems.length).toBeGreaterThan(0)

    useAppStore.getState().setRole('customer')
    expect(useAppStore.getState().role).toBe('customer')
    expect(useAppStore.getState().signature?.status).toBe('unsigned')

    useAppStore.getState().setSignature(SIGNED_SIGNATURE)
    expect(useAppStore.getState().signature?.status).toBe('signed')

    const beforeSwitchCount = useAppStore.getState().pendingSyncList.length

    useAppStore.getState().setRole('teller')
    expect(useAppStore.getState().role).toBe('teller')
    expect(useAppStore.getState().signature?.status).toBe('signed')

    const result = useAppStore.getState().validateAndSubmit()
    expect(result.success).toBe(true)

    const afterCount = useAppStore.getState().pendingSyncList.length
    expect(afterCount).toBe(beforeSwitchCount + 1)

    const latest = useAppStore.getState().pendingSyncList[afterCount - 1]
    expect(latest.ticketNo).toMatch(/^TK/)
    expect(latest.payload.signature.status).toBe('signed')
    expect(latest.payload.submittedBy).toBe('teller')
    expect(latest.payload.status).toBe('submitted')

    const persisted = await getAllPendingSync()
    expect(persisted.length).toBe(afterCount)

    await clearAllData()
  })
})
