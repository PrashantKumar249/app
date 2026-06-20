import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '../types'
import { computeElapsedMs, persistTimerState } from '../services/sessionService'

interface UseQuestionTimerOptions {
  session: Session | null
  isPaused: boolean
  onTick?: (elapsedMs: number) => void
}

export function useQuestionTimer({ session, isPaused, onTick }: UseQuestionTimerOptions) {
  const [tick, setTick] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const onTickRef = useRef(onTick)

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  const elapsedMs = session ? computeElapsedMs(session) : 0

  const syncElapsed = useCallback(() => {
    if (!session) return 0
    const elapsed = computeElapsedMs(session)
    onTickRef.current?.(elapsed)
    return elapsed
  }, [session])

  const pauseTimer = useCallback(async () => {
    if (!session || session.status === 'completed') return
    const elapsed = computeElapsedMs(session)
    await persistTimerState(session.id, elapsed, false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [session])

  const resumeTimer = useCallback(async () => {
    if (!session || session.status === 'completed' || isPaused) return
    const elapsed = computeElapsedMs(session)
    await persistTimerState(session.id, elapsed, true)
    setTick((t) => t + 1)
  }, [session, isPaused])

  useEffect(() => {
    if (!session || isPaused || session.status !== 'active') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = window.setInterval(() => {
      setTick((t) => t + 1)
      if (session) {
        onTickRef.current?.(computeElapsedMs(session))
      }
    }, 250)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [session, isPaused, session?.id, session?.currentQuestion, session?.activeQuestionElapsedMs, session?.activeQuestionStartedAt, session?.status])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        pauseTimer()
      } else if (session?.status === 'active' && !isPaused) {
        resumeTimer()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [pauseTimer, resumeTimer, session?.status, isPaused])

  useEffect(() => {
    return () => {
      if (session && session.status === 'active') {
        const elapsed = computeElapsedMs(session)
        persistTimerState(session.id, elapsed, false)
      }
    }
  }, [session?.id])

  void tick

  return { elapsedMs, pauseTimer, syncElapsed }
}
