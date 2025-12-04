import { NextRequest } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import type { ServiceError } from '@grpc/grpc-js'
import { TrainingClient, type TrainingMetric } from '@/generated/metrics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  // Create a ReadableStream to send SSE (Server-Sent Events)
  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false

      // Create gRPC client using generated proto files
      const client = new TrainingClient(
        process.env.GRPC_SERVER_URL || 'localhost:50051',
        grpc.credentials.createInsecure()
      )

      const cleanup = () => {
        if (isClosed) return
        isClosed = true

        try {
          controller.close()
        } catch (err) {
          // Controller may already be closed, ignore error
        }

        client.close()
      }

      // Subscribe to metrics stream
      const call = client.subscribe({})

      call.on('data', (metric: TrainingMetric) => {
        if (isClosed) return

        try {
          const data = JSON.stringify({
            epoch: metric.epoch,
            batch: metric.batch,
            batch_size: metric.batchSize,
            batch_loss: metric.batchLoss,
            preds: metric.preds,
            truths: metric.truths,
            scores: metric.scores,
            imageIds: metric.imageIds,
          })

          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch (err) {
          console.error('Error enqueueing data:', err)
          cleanup()
        }
      })

      call.on('end', () => {
        console.log('gRPC stream ended')
        cleanup()
      })

      call.on('error', (err: ServiceError) => {
        // Check if this is an intentional cancellation (not a real error)
        if (err.code === 1) {
          console.log('gRPC stream cancelled by client')
        } else {
          console.error('gRPC error:', err)
        }

        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`))
          } catch (e) {
            // Controller may be closed, ignore
          }
        }

        cleanup()
      })

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        call.cancel()
        cleanup()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
