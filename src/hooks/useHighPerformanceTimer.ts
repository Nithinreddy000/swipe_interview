import { useState, useEffect, useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { tick, setRemainingTime } from '@/store/slices/timerSlice'

interface TimerConfig {
  precision?: number
  onTick?: (timeLeft: number) => void
  onComplete?: () => void
  autoStart?: boolean
}

interface TimerControls {
  start: (duration: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  addTime: (seconds: number) => void
  setTime: (seconds: number) => void
}

interface TimerState {
  timeLeft: number
  isRunning: boolean
  isPaused: boolean
  duration: number
  progress: number
}

export function useHighPerformanceTimer(config: TimerConfig = {}): [TimerState, TimerControls] {
  const {
    precision = 100,
    onTick,
    onComplete,
  } = config

  const dispatch = useDispatch()
  
  const [state, setState] = useState<TimerState>({
    timeLeft: 0,
    isRunning: false,
    isPaused: false,
    duration: 0,
    progress: 0
  })

  const animationRef = useRef<number>()
  const lastUpdateRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

  const updateTimer = useCallback(() => {
    const now = performance.now()
    
    if (now - lastUpdateRef.current >= precision) {
      const elapsed = now - startTimeRef.current - pausedTimeRef.current
      const newTimeLeft = Math.max(0, state.duration * 1000 - elapsed)
      const timeLeftSeconds = newTimeLeft / 1000
      
      setState(prev => ({
        ...prev,
        timeLeft: timeLeftSeconds,
        progress: prev.duration > 0 ? (1 - timeLeftSeconds / prev.duration) * 100 : 0
      }))

      dispatch(setRemainingTime(timeLeftSeconds))
      dispatch(tick())
      
      if (onTick) {
        onTick(timeLeftSeconds)
      }

      if (newTimeLeft <= 0) {
        setState(prev => ({ ...prev, isRunning: false }))
        if (onComplete) {
          onComplete()
        }
        return
      }

      lastUpdateRef.current = now
    }

    if (state.isRunning && !state.isPaused) {
      animationRef.current = requestAnimationFrame(updateTimer)
    }
  }, [state.duration, state.isRunning, state.isPaused, precision, onTick, onComplete, dispatch])

  const start = useCallback((duration: number) => {
    const now = performance.now()
    startTimeRef.current = now
    pausedTimeRef.current = 0
    lastUpdateRef.current = now

    setState({
      timeLeft: duration,
      isRunning: true,
      isPaused: false,
      duration,
      progress: 0
    })
  }, [])

  const pause = useCallback(() => {
    if (state.isRunning && !state.isPaused) {
      setState(prev => ({ ...prev, isPaused: true }))
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [state.isRunning, state.isPaused])

  const resume = useCallback(() => {
    if (state.isRunning && state.isPaused) {
      const now = performance.now()
      pausedTimeRef.current += now - lastUpdateRef.current
      lastUpdateRef.current = now
      
      setState(prev => ({ ...prev, isPaused: false }))
    }
  }, [state.isRunning, state.isPaused])

  const stop = useCallback(() => {
    setState({
      timeLeft: 0,
      isRunning: false,
      isPaused: false,
      duration: 0,
      progress: 0
    })
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const addTime = useCallback((seconds: number) => {
    setState(prev => ({
      ...prev,
      timeLeft: Math.max(0, prev.timeLeft + seconds),
      duration: Math.max(0, prev.duration + seconds)
    }))
  }, [])

  const setTime = useCallback((seconds: number) => {
    setState(prev => ({
      ...prev,
      timeLeft: Math.max(0, seconds),
      duration: Math.max(0, seconds),
      progress: 0
    }))
  }, [])

  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      animationRef.current = requestAnimationFrame(updateTimer)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [state.isRunning, state.isPaused, updateTimer])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const controls: TimerControls = {
    start,
    pause,
    resume,
    stop,
    addTime,
    setTime
  }

  return [state, controls]
}

export function useTimerWithSync(config: TimerConfig = {}) {
  const [timerState, timerControls] = useHighPerformanceTimer(config)
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && timerState.isRunning && !timerState.isPaused) {
        timerControls.pause()
      } else if (!document.hidden && timerState.isRunning && timerState.isPaused) {
        timerControls.resume()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [timerState.isRunning, timerState.isPaused, timerControls])

  return [timerState, timerControls]
}

export function formatTimerDisplay(seconds: number, format: 'mm:ss' | 'h:mm:ss' | 'compact' = 'mm:ss'): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  switch (format) {
    case 'h:mm:ss':
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    case 'compact':
      if (hours > 0) return `${hours}h ${minutes}m`
      if (minutes > 0) return `${minutes}m ${secs}s`
      return `${secs}s`
    case 'mm:ss':
    default:
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}