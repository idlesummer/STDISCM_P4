import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { TrainingMetric, LossDataPoint } from './use-fake-training'

export function useRealTraining(
  isTraining: boolean,
  setIsTraining: (value: boolean) => void,
) {
  // State
  const [metric, setCurrentMetric] = useState<TrainingMetric | null>(null)
  const [lossHistory, setLossHistory] = useState<LossDataPoint[]>([])
  const [error, setError] = useState<string | null>(null)
  const hasShownErrorRef = useRef(false)

  // Effect
  useEffect(() => {
    if (!isTraining) return

    let eventSource: EventSource | null = null
    hasShownErrorRef.current = false

    // Start training first
    const startTraining = async () => {
      try {
        const response = await fetch('/dashboard/api/training/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ numEpochs: 3 }),
        })

        const data = await response.json()

        if (!response.ok || data.error) {
          const errorMsg = data.error || 'Failed to start training'
          if (!hasShownErrorRef.current) {
            toast.error(errorMsg, { id: 'training-error' })
            hasShownErrorRef.current = true
          }
          throw new Error(errorMsg)
        }

        console.log('Training started:', data)

        // Now subscribe to metrics stream
        eventSource = new EventSource('/dashboard/api/training/subscribe')

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.error) {
              setError(data.error)
              if (!hasShownErrorRef.current) {
                toast.error(data.error, { id: 'training-error' })
                hasShownErrorRef.current = true
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
          const errorMsg = 'Connection to server lost'
          setError(errorMsg)
          if (!hasShownErrorRef.current) {
            toast.error(errorMsg, { id: 'training-error' })
            hasShownErrorRef.current = true
          }
          eventSource?.close()
          setIsTraining(false)
        }
      } catch (err: any) {
        console.error('Error starting training:', err)
        const errorMsg = err.message || 'Failed to connect to server'
        setError(errorMsg)
        if (!hasShownErrorRef.current) {
          toast.error('Server not connected. Please start the backend server.', { id: 'training-error' })
          hasShownErrorRef.current = true
        }
        setIsTraining(false)
      }
    }

    startTraining()

    return () => {
      eventSource?.close()
      hasShownErrorRef.current = false
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
