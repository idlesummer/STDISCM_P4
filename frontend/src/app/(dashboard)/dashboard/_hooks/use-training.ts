import { useEffect, useState, useRef } from 'react'
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

  // Refs for retry logic
  const retryCount = useRef(0)
  const retryTimeout = useRef<NodeJS.Timeout | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const hasShownErrorRef = useRef(false)
  const isReconnectingRef = useRef(false)

  // Effect
  useEffect(() => {
    if (!isTraining) {
      // Clean up on stop
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current)
        retryTimeout.current = null
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      retryCount.current = 0
      isReconnectingRef.current = false
      return
    }

    const connectToStream = () => {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Create new EventSource connection
      const eventSource = new EventSource('/dashboard/api/training/subscribe')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('EventSource connection established')

        // Show reconnection success if we were reconnecting
        if (isReconnectingRef.current) {
          toast.success('Reconnected to training stream')
        }

        // Reset retry state on successful connection
        retryCount.current = 0
        isReconnectingRef.current = false
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.error) {
            setError(data.error)
            if (!hasShownErrorRef.current) {
              toast.error(data.error)
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
        eventSource.close()

        // Check if we should retry
        if (retryCount.current < MAX_RETRIES) {
          // Calculate exponential backoff delay
          const delay = Math.min(
            INITIAL_RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount.current),
            MAX_RETRY_DELAY,
          )

          retryCount.current += 1
          isReconnectingRef.current = true

          console.log(`Connection lost. Retrying in ${delay}ms (attempt ${retryCount.current}/${MAX_RETRIES})`)

          // Show reconnection toast
          if (!hasShownErrorRef.current) {
            toast.warning(
              `Connection lost. Reconnecting in ${Math.round(delay / 1000)}s... (${retryCount.current}/${MAX_RETRIES})`,
              { duration: delay },
            )
            hasShownErrorRef.current = true
          }

          // Schedule reconnection
          retryTimeout.current = setTimeout(() => {
            hasShownErrorRef.current = false
            connectToStream()
          }, delay)
        } else {
          // Max retries exceeded
          const errorMsg = 'Connection to server lost. Max retries exceeded.'
          setError(errorMsg)
          toast.error(errorMsg, { duration: 5000 })
          setIsTraining(false)
        }
      }
    }

    // Initial connection
    connectToStream()

    // Cleanup function
    return () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current)
        retryTimeout.current = null
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      retryCount.current = 0
      hasShownErrorRef.current = false
      isReconnectingRef.current = false
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
