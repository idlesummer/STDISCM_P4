import { useEffect, useState } from 'react'
import { TrainingMetric, LossDataPoint } from '../_types/training'

export function useFakeTraining(
  isTraining: boolean,
  setIsTraining: (value: boolean) => void,
) {
  // State
  const [metric, setCurrentMetric] = useState<TrainingMetric | null>(null)
  const [lossHistory, setLossHistory] = useState<LossDataPoint[]>([])

  // Effect
  useEffect(() => {
    if (!isTraining) return

    const interval = setInterval(() => {
      setLossHistory(prev => {
        const batch = prev.length + 1
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
        if (batch >= 50)        // Stop after 50 batches
          setIsTraining(false) 

        return [...prev, { batch, loss }]
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTraining, setIsTraining])

  // 3. Local functions (actions)
  const resetTraining = () => {
    setCurrentMetric(null)
    setLossHistory([])
  }

  return { metric, lossHistory, resetTraining }
}
