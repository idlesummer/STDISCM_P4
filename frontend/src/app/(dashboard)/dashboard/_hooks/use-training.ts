import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { TrainingMetric, LossDataPoint } from '../_types/training'

// Exponential backoff configuration
const INITIAL_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 30000 // 30 seconds
const MAX_RETRIES = 5
const BACKOFF_MULTIPLIER = 2

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

    // Closure state for reconnection logic
    let retryCount = 0
    let retryTimeout: NodeJS.Timeout | null = null
    let eventSource: EventSource | null = null
    let hasShownError = false
    let isReconnecting = false

    const connectToStream = () => {
      // Close existing connection if any
      if (eventSource)
        eventSource.close()

      // Create new EventSource connection
      eventSource = new EventSource('/dashboard/api/training/subscribe')

      eventSource.onopen = () => {
        console.log('EventSource connection established')

        // Show reconnection success if we were reconnecting
        if (isReconnecting)
          toast.success('Reconnected to training stream')

        // Reset retry state on successful connection
        retryCount = 0
        isReconnecting = false
      }

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

          console.log('Received metric with image_ids:', metric.image_ids)

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
        eventSource?.close()

        // Prevent multiple simultaneous retry attempts
        if (isReconnecting) {
          console.log('Already reconnecting, ignoring additional error event')
          return
        }

        // If max retries exceeded
        if (retryCount >= MAX_RETRIES) {
          const errorMsg = 'Connection to server lost. Max retries exceeded.'
          setError(errorMsg)
          toast.error(errorMsg, { duration: 5000 })
          setIsTraining(false)
          return
        }

        // Calculate exponential backoff delay
        const retryDelay = INITIAL_RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount)
        const delay = Math.min(retryDelay, MAX_RETRY_DELAY)

        retryCount++
        isReconnecting = true

        console.log(`Connection lost. Retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`)

        // Show reconnection toast
        if (!hasShownError) {
          const message = `Connection lost. Reconnecting in ${Math.round(delay / 1000)}s... (${retryCount}/${MAX_RETRIES})`
          const data = { duration: delay }
          toast.warning(message, data)
          hasShownError = true
        }

        // Schedule reconnection
        retryTimeout = setTimeout(() => {
          hasShownError = false
          connectToStream()
        }, delay)
      }
    }

    // Initial connection
    connectToStream()

    // Cleanup function
    return () => {
      if (retryTimeout)
        clearTimeout(retryTimeout)
      if (eventSource)
        eventSource.close()
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
