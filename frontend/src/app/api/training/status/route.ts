import { NextRequest, NextResponse } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import { TrainingClient } from '@/proto/metrics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Create gRPC client using generated proto files
    const client = new TrainingClient(
      process.env.GRPC_SERVER_URL || 'localhost:50051',
      grpc.credentials.createInsecure()
    )

    // Call Status RPC
    return new Promise<NextResponse>((resolve) => {
      client.status({}, (error: any, response: any) => {
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
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
