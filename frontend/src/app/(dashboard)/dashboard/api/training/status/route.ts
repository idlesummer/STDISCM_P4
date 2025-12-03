import { NextRequest, NextResponse } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import { TrainingClient } from '@/generated/metrics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const client = new TrainingClient(
    process.env.GRPC_SERVER_URL || 'localhost:50051',
    grpc.credentials.createInsecure()
  )

  try {
    // Call Status RPC
    return new Promise<NextResponse>((resolve) => {
      client.status({}, (error: any, response: any) => {
        // Close client after call completes
        client.close()

        if (error) {
          console.error('gRPC Status error:', error)
          resolve(NextResponse.json(
            { error: error.message },
            { status: 500 }
          ))
        } else {
          resolve(NextResponse.json({
            status: response.status,
            message: response.message,
            epoch: response.epoch,
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
