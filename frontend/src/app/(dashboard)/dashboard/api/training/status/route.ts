import { NextRequest, NextResponse } from 'next/server'
import { promisify } from 'util'
import * as grpc from '@grpc/grpc-js'
import type { ServiceError } from '@grpc/grpc-js'
import { TrainingClient, type StatusReq, type StatusRes } from '@/generated/metrics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const client = new TrainingClient(
    process.env.GRPC_SERVER_URL || 'localhost:50051',
    grpc.credentials.createInsecure()
  )

  try {
    // Promisify the status method
    const statusAsync = promisify<StatusReq, StatusRes>(
      client.status.bind(client)
    )

    // Call Status RPC
    const response = await statusAsync({})

    // Close client after call completes
    client.close()

    return NextResponse.json({
      status: response.status,
      message: response.message,
      epoch: response.epoch,
    })
  } catch (error) {
    client.close()

    const grpcError = error as ServiceError
    console.error('gRPC Status error:', grpcError)

    return NextResponse.json(
      { error: grpcError.message || 'Unknown error occurred' },
      { status: 500 }
    )
  }
}
