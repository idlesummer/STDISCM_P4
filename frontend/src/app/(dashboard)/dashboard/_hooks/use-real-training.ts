import { useEffect, useState } from 'react'
import { TrainingMetric, LossDataPoint } from './use-fake-training'

export function useRealTraining(
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

    // Start training first
    const startTraining = async () => {
      try {
        const response = await fetch('/api/training/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ numEpochs: 3 }),
        })

        const data = await response.json()

        if (!response.ok || data.error) {
          throw new Error(data.error || 'Failed to start training')
        }

        console.log('Training started:', data)

        // Now subscribe to metrics stream
        eventSource = new EventSource('/api/training/subscribe')

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.error) {
              setError(data.error)
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
            }

            setCurrentMetric(metric)
            setLossHistory((prev) => [
              ...prev,
              { batch: data.batch, loss: data.batch_loss },
            ])
          } catch (err) {
            console.error('Error parsing metric:', err)
          }
        }

        eventSource.onerror = (err) => {
          console.error('EventSource error:', err)
          setError('Connection to server lost')
          eventSource?.close()
          setIsTraining(false)
        }
      } catch (err: any) {
        console.error('Error starting training:', err)
        setError(err.message)
        setIsTraining(false)
      }
    }

    startTraining()

    return () => {
      eventSource?.close()
    }
  }, [isTraining, setIsTraining])

  // Local functions (actions)
  const resetTraining = () => {
    setCurrentMetric(null)
    setLossHistory([])
    setError(null)
  }

  return { metric, lossHistory, resetTraining, error }
}
