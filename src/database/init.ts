import Dexie from 'dexie'
import { db } from './db'
import { seedDatabaseIfNeeded } from './seed'

const DB_NAME = 'ssc-practice-tracker'
const OPEN_TIMEOUT_MS = 12_000

let initPromise: Promise<void> | null = null

function isIndexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

function openWithTimeout(): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false

    const cleanup = (onBlocked: () => void) => {
      window.clearTimeout(timer)
      db.on('blocked').unsubscribe(onBlocked)
    }

    const timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      cleanup(onBlocked)
      reject(
        new Error(
          'Database is taking too long to open. Close other tabs with this app, then tap Retry.',
        ),
      )
    }, OPEN_TIMEOUT_MS)

    const onBlocked = () => {
      if (settled) return
      settled = true
      cleanup(onBlocked)
      reject(
        new Error(
          'Database upgrade blocked. Close all other tabs/windows with Abhyas open, then tap Retry.',
        ),
      )
    }

    db.on('blocked', onBlocked)

    db.open()
      .then(() => {
        if (settled) return
        settled = true
        cleanup(onBlocked)
        resolve()
      })
      .catch((err: unknown) => {
        if (settled) return
        settled = true
        cleanup(onBlocked)
        reject(err)
      })
  })
}

async function resetDatabase(): Promise<void> {
  try {
    db.close()
  } catch {
    // ignore close errors during recovery
  }
  await Dexie.delete(DB_NAME)
}

async function openDatabaseWithRecovery(): Promise<void> {
  try {
    await openWithTimeout()
  } catch (firstError) {
    const message = firstError instanceof Error ? firstError.message : ''
    const shouldRecover =
      message.includes('blocked') ||
      message.includes('too long') ||
      (firstError instanceof Dexie.DatabaseClosedError) ||
      (firstError instanceof Dexie.UpgradeError)

    if (!shouldRecover) {
      throw firstError
    }

    await resetDatabase()
    await openWithTimeout()
  }
}

async function runInit(): Promise<void> {
  if (!isIndexedDbAvailable()) {
    throw new Error(
      'Storage is not available. Turn off private/incognito mode or free up browser storage, then retry.',
    )
  }

  await openDatabaseWithRecovery()
  await seedDatabaseIfNeeded()
}

export function initializeDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = runInit().catch((error) => {
      initPromise = null
      throw error
    })
  }
  return initPromise
}

export function resetInitAndDatabase(): Promise<void> {
  initPromise = null
  return resetDatabase()
}
