import 'fake-indexeddb/auto'
import { validateSubmission, checkAttachmentSize, validateStatusChange } from '@/lib/validators'
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

describe('附件过大要提示压缩作为状态变更前置条件', () => {
  const LARGE_ATTACHMENT: AttachmentPhoto = {
    id: 'att-large',
    name: 'big_file.jpg',
    size: 6 * 1024 * 1024,
    type: 'image/jpeg',
    dataUrl: '',
    compressed: false,
    originalSize: 6 * 1024 * 1024,
  }

  const MEDIUM_ATTACHMENT: AttachmentPhoto = {
    id: 'att-medium',
    name: 'medium_file.jpg',
    size: 4 * 1024 * 1024,
    type: 'image/jpeg',
    dataUrl: '',
    compressed: false,
    originalSize: 4 * 1024 * 1024,
  }

  const SMALL_ATTACHMENT: AttachmentPhoto = {
    id: 'att-small',
    name: 'small_file.jpg',
    size: 1 * 1024 * 1024,
    type: 'image/jpeg',
    dataUrl: '',
    compressed: false,
    originalSize: 1 * 1024 * 1024,
  }

  const COMPRESSED_LARGE_ATTACHMENT: AttachmentPhoto = {
    ...LARGE_ATTACHMENT,
    size: 2 * 1024 * 1024,
    compressed: true,
  }

  it('validateStatusChange: 附件过大应返回错误，阻止状态变更', () => {
    const result = validateStatusChange([LARGE_ATTACHMENT])
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('过大')])
    )
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('请先压缩后再进行状态变更')])
    )
  })

  it('validateStatusChange: 附件较大应返回警告，但不阻止状态变更', () => {
    const result = validateStatusChange([MEDIUM_ATTACHMENT])
    expect(result.valid).toBe(true)
    expect(result.errors.length).toBe(0)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('较大')])
    )
  })

  it('validateStatusChange: 正常大小附件应通过验证', () => {
    const result = validateStatusChange([SMALL_ATTACHMENT])
    expect(result.valid).toBe(true)
    expect(result.errors.length).toBe(0)
    expect(result.warnings.length).toBe(0)
  })

  it('validateStatusChange: 压缩后的附件应通过验证', () => {
    const result = validateStatusChange([COMPRESSED_LARGE_ATTACHMENT])
    expect(result.valid).toBe(true)
    expect(result.errors.length).toBe(0)
  })

  it('validateStatusChange: 混合附件中只要有一个过大就应阻止状态变更', () => {
    const result = validateStatusChange([SMALL_ATTACHMENT, LARGE_ATTACHMENT, MEDIUM_ATTACHMENT])
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('big_file.jpg')])
    )
  })

  it('validateSubmission 复用 validateStatusChange 确保提交也检查附件大小', () => {
    const submissionResult = validateSubmission(SIGNED_SIGNATURE, [LARGE_ATTACHMENT], SAMPLE_ITEMS)
    const statusResult = validateStatusChange([LARGE_ATTACHMENT])
    
    expect(submissionResult.valid).toBe(false)
    expect(statusResult.valid).toBe(false)
    expect(submissionResult.errors).toEqual(
      expect.arrayContaining(statusResult.errors)
    )
  })

  it('store.updateProcessingItemStatus: 附件过大时不能更新办理事项状态', async () => {
    const { useAppStore } = await import('@/store/useAppStore')
    const { resetDBInstance, clearAllData } = await import('@/lib/db')
    
    resetDBInstance()
    await clearAllData()
    
    useAppStore.getState().reset()
    useAppStore.getState().setRole('supervisor')
    
    const items = useAppStore.getState().processingItems
    expect(items.length).toBeGreaterThan(0)
    
    const firstItemId = items[0].id
    const initialStatus = items[0].status
    
    const initialAttachmentCount = useAppStore.getState().attachments.length
    useAppStore.getState().addAttachment(LARGE_ATTACHMENT)
    expect(useAppStore.getState().attachments.length).toBe(initialAttachmentCount + 1)
    
    const hasLargeAttachment = useAppStore.getState().attachments.some(a => a.size > 5 * 1024 * 1024)
    expect(hasLargeAttachment).toBe(true)
    
    const result = useAppStore.getState().updateProcessingItemStatus(firstItemId, 'completed')
    
    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('过大')])
    )
    
    const updatedItem = useAppStore.getState().processingItems.find(i => i.id === firstItemId)
    expect(updatedItem?.status).toBe(initialStatus)
    
    expect(useAppStore.getState().validationErrors.length).toBeGreaterThan(0)
    expect(useAppStore.getState().validationErrors).toEqual(
      expect.arrayContaining([expect.stringContaining('请先压缩后再进行状态变更')])
    )
    
    await clearAllData()
  })

  it('store.updateProcessingItemStatus: 附件正常时可以更新办理事项状态', async () => {
    const { useAppStore } = await import('@/store/useAppStore')
    const { resetDBInstance, clearAllData } = await import('@/lib/db')
    
    resetDBInstance()
    await clearAllData()
    
    useAppStore.getState().reset()
    useAppStore.getState().setRole('supervisor')
    
    const items = useAppStore.getState().processingItems
    const firstItemId = items[0].id
    
    useAppStore.getState().addAttachment(SMALL_ATTACHMENT)
    
    const result = useAppStore.getState().updateProcessingItemStatus(firstItemId, 'completed')
    
    expect(result.success).toBe(true)
    expect(result.errors.length).toBe(0)
    
    const updatedItem = useAppStore.getState().processingItems.find(i => i.id === firstItemId)
    expect(updatedItem?.status).toBe('completed')
    
    expect(useAppStore.getState().validationErrors.length).toBe(0)
    
    await clearAllData()
  })

  it('store.approveSubmission: 附件过大时不能审批通过', async () => {
    const { useAppStore } = await import('@/store/useAppStore')
    const { resetDBInstance, clearAllData } = await import('@/lib/db')
    
    resetDBInstance()
    await clearAllData()
    
    useAppStore.getState().reset()
    useAppStore.getState().setRole('teller')
    useAppStore.getState().setSignature(SIGNED_SIGNATURE)
    useAppStore.getState().addAttachment(SMALL_ATTACHMENT)
    
    const submitResult = useAppStore.getState().validateAndSubmit()
    expect(submitResult.success).toBe(true)
    
    const submissionId = useAppStore.getState().submissions[0]?.id
    expect(submissionId).toBeDefined()
    
    useAppStore.getState().addAttachment(LARGE_ATTACHMENT)
    
    const approveResult = useAppStore.getState().approveSubmission(submissionId)
    
    expect(approveResult.success).toBe(false)
    expect(approveResult.errors.length).toBeGreaterThan(0)
    expect(approveResult.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('过大')])
    )
    
    expect(useAppStore.getState().validationErrors.length).toBeGreaterThan(0)
    
    await clearAllData()
  })

  it('键盘操作提交时也会检查附件大小', async () => {
    const { useAppStore } = await import('@/store/useAppStore')
    const { resetDBInstance, clearAllData } = await import('@/lib/db')
    
    resetDBInstance()
    await clearAllData()
    
    useAppStore.getState().reset()
    useAppStore.getState().setRole('teller')
    useAppStore.getState().setSignature(SIGNED_SIGNATURE)
    
    const initialAttachmentCount = useAppStore.getState().attachments.length
    useAppStore.getState().addAttachment(LARGE_ATTACHMENT)
    expect(useAppStore.getState().attachments.length).toBe(initialAttachmentCount + 1)
    
    const hasLargeAttachment = useAppStore.getState().attachments.some(a => a.size > 5 * 1024 * 1024)
    expect(hasLargeAttachment).toBe(true)
    
    const submitResult = useAppStore.getState().validateAndSubmit()
    
    expect(submitResult.success).toBe(false)
    expect(submitResult.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('过大')])
    )
    
    expect(useAppStore.getState().currentSubmission).toBeNull()
    expect(useAppStore.getState().attachments.length).toBeGreaterThan(initialAttachmentCount)
    
    await clearAllData()
  })

  it('附件过大时压缩后可以正常提交和状态变更', async () => {
    const { useAppStore } = await import('@/store/useAppStore')
    const { resetDBInstance, clearAllData } = await import('@/lib/db')
    
    resetDBInstance()
    await clearAllData()
    
    useAppStore.getState().reset()
    useAppStore.getState().setRole('teller')
    useAppStore.getState().setSignature(SIGNED_SIGNATURE)
    
    const existingAttachments = useAppStore.getState().attachments
    existingAttachments.forEach(att => {
      useAppStore.getState().removeAttachment(att.id)
    })
    
    useAppStore.getState().addAttachment(LARGE_ATTACHMENT)
    expect(useAppStore.getState().attachments.length).toBe(1)
    
    let submitResult = useAppStore.getState().validateAndSubmit()
    expect(submitResult.success).toBe(false)
    
    const attId = useAppStore.getState().attachments[0].id
    useAppStore.getState().compressAttachment(attId, 'data:image/jpeg;base64,compressed', 2 * 1024 * 1024)
    
    submitResult = useAppStore.getState().validateAndSubmit()
    expect(submitResult.success).toBe(true)
    expect(useAppStore.getState().currentSubmission).not.toBeNull()
    
    await clearAllData()
  })
})
