import { NextRequest, NextResponse } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import { TrainingClient } from '@/generated/metrics'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const numEpochs = body.numEpochs || 3

    // Create gRPC client using generated proto files
    const client = new TrainingClient(
      process.env.GRPC_SERVER_URL || 'localhost:50051',
      grpc.credentials.createInsecure()
    )

    // Call Start RPC
    return new Promise<NextResponse>((resolve) => {
      client.start({ numEpochs, confirmed: true }, (error: any, response: any) => {
          if (error) {
            console.error('gRPC Start error:', error)
            resolve(NextResponse.json(
              { error: error.message },
              { status: 500 }
            ))
          } else {
            resolve(NextResponse.json({
              status: response.status,
              message: response.message,
            }))
          }
        }
      )
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
