import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { TrainingMetric, LossDataPoint } from '../_types/training'

export function useTraining(
  isTraining: boolean,
  setIsTraining: (value: boolean) => void,
) {
  // State
  const [metric, setCurrentMetric] = useState<TrainingMetric | null>(null)
  const [lossHistory, setLossHistory] = useState<LossDataPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  // Effect
  useEffect(() => {
    if (!isTraining) return

    let eventSource: EventSource | null = null
    let hasShownError = false

    // Subscribe to metrics stream
    eventSource = new EventSource('/dashboard/api/training/subscribe')
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.error) {
          setError(data.error)
          if (!hasShownError) {
            toast.error(data.error)
            hasShownError = true
          }
          setIsTraining(false)
          return
        }

        const metric: TrainingMetric = {
          epoch: data.epoch,
          batch: data.batch,
          batch_size: data.batch_size,
          batch_loss: data.batch_loss,
          preds: data.preds,
          truths: data.truths,
          scores: data.scores,
          image_ids: data.imageIds || data.image_ids || [],
        }

        const batch = data.batch
        const loss = data.batch_loss
        setCurrentMetric(metric)
        setLossHistory(prev => [...prev, { batch, loss }])

      } catch (err) {
        console.error('Error parsing metric:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err)
      const errorMsg = 'Connection to server lost'
      setError(errorMsg)
      if (!hasShownError) {
        toast.error(errorMsg)
        hasShownError = true
      }
      eventSource?.close()
      setIsTraining(false)
    }

    return () => eventSource?.close()

  }, [isTraining, setIsTraining])

  // Local functions (actions)
  const resetTraining = () => {
    setCurrentMetric(null)
    setLossHistory([])
    setError(null)
  }

  return { metric, lossHistory, resetTraining, error }
}
