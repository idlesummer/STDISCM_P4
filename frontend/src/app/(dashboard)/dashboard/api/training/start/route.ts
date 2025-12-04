import { NextRequest, NextResponse } from 'next/server'
import { promisify } from 'util'
import * as grpc from '@grpc/grpc-js'
import type { ServiceError } from '@grpc/grpc-js'
import { TrainingClient, type StartReq, type StartRes } from '@/generated/metrics'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const addr = process.env.GRPC_SERVER_URL!
  const creds = grpc.credentials.createInsecure()
  const client = new TrainingClient(addr, creds)

  try {
    const body = await request.json()
    const numEpochs = body.numEpochs || 20

    // Promisify the start method
    const startAsync = promisify<StartReq, StartRes>(client.start.bind(client))

    // Call Start RPC
    const response = await startAsync({ numEpochs, confirmed: true })

    // Close client after call completes
    client.close()
    const status = response.status
    const message = response.message
    return NextResponse.json({ status, message })

  } catch (error) {
    client.close()
    const grpcError = error as ServiceError
    const errorMsg = grpcError.code === 14
      ? 'Failed to connect to server. Please start the backend server.'
      : grpcError.message || 'Unknown error occurred'

    console.error('gRPC Start error:', errorMsg)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
