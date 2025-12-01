import { useEffect, useState } from 'react'

export interface FPSDataPoint {
  time: number
  fps: number
}

export function useFps() {
  const [fps, setFps] = useState(60)
  const [fpsHistory, setFpsHistory] = useState<FPSDataPoint[]>([])

  useEffect(() => {
    let rafId: number
    let lastTime = performance.now()
    let frameCounter = 0

    const handleFrameUpdate = () => {
      frameCounter++
      const now = performance.now()
      const elapsedMs = now - lastTime

      if (elapsedMs >= 1000) {
        const newFps = Math.round((frameCounter * 1000) / elapsedMs)

        setFps(newFps)
        setFpsHistory(hist => [...hist.slice(-19),{ time: hist.length, fps: newFps }])

        frameCounter = 0
        lastTime = now
      }
    }

    const runLoop = () => {
      handleFrameUpdate()
      rafId = requestAnimationFrame(runLoop)
    }

    rafId = requestAnimationFrame(runLoop)

    return () => cancelAnimationFrame(rafId)
  }, [])

  return { fps, fpsHistory }
}
