import { NextRequest } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import { TrainingClient } from '@/proto/metrics_grpc_pb'
import { SubscribeReq } from '@/proto/metrics_pb'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  // Create a ReadableStream to send SSE (Server-Sent Events)
  const stream = new ReadableStream({
    start(controller) {
      // Create gRPC client using generated proto files
      const client = new TrainingClient(
        process.env.GRPC_SERVER_URL || 'localhost:50051',
        grpc.credentials.createInsecure()
      )

      // Subscribe to metrics stream
      const subscribeReq = new SubscribeReq()
      const call = client.subscribe(subscribeReq)

      call.on('data', (metric: any) => {
        const data = JSON.stringify({
          epoch: metric.epoch,
          batch: metric.batch,
          batch_size: metric.batch_size,
          batch_loss: metric.batch_loss,
          preds: metric.preds,
          truths: metric.truths,
          scores: metric.scores,
        })

        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      })

      call.on('end', () => {
        console.log('gRPC stream ended')
        controller.close()
      })

      call.on('error', (err: any) => {
        console.error('gRPC error:', err)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`))
        controller.close()
      })

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        call.cancel()
        controller.close()
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
