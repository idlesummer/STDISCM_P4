import { NextRequest, NextResponse } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import { TrainingClient } from '@/generated/metrics'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const client = new TrainingClient(
    process.env.GRPC_SERVER_URL || 'localhost:50051',
    grpc.credentials.createInsecure()
  )

  try {
    const body = await request.json()
    const numEpochs = body.numEpochs || 3

    // Call Start RPC
    return new Promise<NextResponse>((resolve) => {
      client.start({ numEpochs, confirmed: true }, (error: any, response: any) => {
        // Close client after call completes
        client.close()

        if (error) {
          const errorMsg = error.code === 14
            ? 'Failed to connect to server. Please start the backend server.'
            : error.message
          console.error('gRPC Start error:', errorMsg)
          resolve(NextResponse.json(
            { error: errorMsg },
            { status: 500 }
          ))
        } else {
          resolve(NextResponse.json({
            status: response.status,
            message: response.message,
          }))
        }
      })
    })
  } catch (error: any) {
    client.close()
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
