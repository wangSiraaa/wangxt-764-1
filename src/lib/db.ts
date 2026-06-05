import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'counter_db'
const DB_VERSION = 1

let dbInstance: IDBPDatabase | null = null

export function resetDBInstance(): void {
  dbInstance = null
}

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('submissions')) {
        db.createObjectStore('submissions', { keyPath: 'id' })
      }
    },
  })
  return dbInstance
}

export async function addPendingSync(item: import('@/types').PendingSyncItem): Promise<void> {
  const db = await getDB()
  await db.put('pending_sync', item)
}

export async function removePendingSync(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('pending_sync', id)
}

export async function getAllPendingSync(): Promise<import('@/types').PendingSyncItem[]> {
  const db = await getDB()
  return db.getAll('pending_sync')
}

export async function saveSubmission(submission: import('@/types').SubmissionResult): Promise<void> {
  const db = await getDB()
  await db.put('submissions', submission)
}

export async function getAllSubmissions(): Promise<import('@/types').SubmissionResult[]> {
  const db = await getDB()
  return db.getAll('submissions')
}

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await db.clear('pending_sync')
  await db.clear('submissions')
}
