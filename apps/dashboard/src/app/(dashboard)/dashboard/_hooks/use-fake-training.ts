import { useEffect, useState } from 'react'

export type TrainingMetric = {
  epoch: number
  batch: number
  batch_size: number
  batch_loss: number
  preds: number[]
  truths: number[]
  scores: number[]
}

export type LossDataPoint = {
  batch: number
  loss: number
}

export function useFakeTraining(isTraining: boolean) {
  const [currentMetric, setCurrentMetric] = useState<TrainingMetric | null>(null)
  const [lossHistory, setLossHistory] = useState<LossDataPoint[]>([])

  useEffect(() => {
    if (!isTraining) return

    const interval = setInterval(() => {
      const batch = lossHistory.length + 1
      const loss = Math.max(0.1, 2.5 * Math.exp(-batch * 0.05) + Math.random() * 0.2)

      const metric: TrainingMetric = {
        epoch: Math.floor(batch / 10) + 1,
        batch,
        batch_size: 32,
        batch_loss: loss,
        preds: Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)),
        truths: Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)),
        scores: Array.from({ length: 16 }, () => Math.random() * 0.4 + 0.6),
      }

      setCurrentMetric(metric)
      setLossHistory(prev => [...prev, { batch, loss }])
    }, 1000)

    return () => clearInterval(interval)
  }, [isTraining, lossHistory.length])

  // Expose everything the component needs
  return {
    currentMetric,
    lossHistory,
    resetTraining: () => {
      setCurrentMetric(null)
      setLossHistory([])
    },
  }
}
