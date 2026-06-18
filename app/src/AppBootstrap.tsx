import { useCallback, useEffect, useState } from 'react'
import App from './App.tsx'
import { initializeDatabase, resetInitAndDatabase } from './database/init'

export function AppBootstrap() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  const boot = useCallback(async (hardReset = false) => {
    setError(null)
    setRetrying(true)
    try {
      if (hardReset) await resetInitAndDatabase()
      await initializeDatabase()
      setReady(true)
    } catch (err) {
      setReady(false)
      setError(err instanceof Error ? err.message : 'Failed to initialize app storage')
    } finally {
      setRetrying(false)
    }
  }, [])

  useEffect(() => {
    boot(false)
  }, [boot])

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-app p-6 text-center">
        <p className="text-lg font-semibold text-danger">Could not start app</p>
        <p className="max-w-sm text-sm text-muted">{error}</p>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <button
            type="button"
            disabled={retrying}
            onClick={() => boot(false)}
            className="rounded-lg bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {retrying ? 'Retrying...' : 'Retry'}
          </button>
          <button
            type="button"
            disabled={retrying}
            onClick={() => boot(true)}
            className="rounded-lg border border-app py-3 text-sm text-muted disabled:opacity-50"
          >
            Reset app data & retry
          </button>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-app p-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-app border-t-accent" />
        <p className="text-muted">Loading SSC Practice Tracker...</p>
      </div>
    )
  }

  return <App />
}
