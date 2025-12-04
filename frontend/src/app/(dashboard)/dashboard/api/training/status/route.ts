import { NextResponse } from 'next/server'
import { promisify } from 'util'
import * as grpc from '@grpc/grpc-js'
import type { ServiceError } from '@grpc/grpc-js'
import { TrainingClient, type StatusReq, type StatusRes } from '@/generated/metrics'

export const dynamic = 'force-dynamic'

export async function GET() {
  const addr = process.env.GRPC_SERVER_URL!
  const cred = grpc.credentials.createInsecure()
  const client = new TrainingClient(addr, cred)

  try {
    // Promisify the status method
    const statusAsync = promisify<StatusReq, StatusRes>(client.status.bind(client))

    // Call Status RPC
    const response = await statusAsync({})

    // Close client after call completes
    client.close()

    const status = response.status
    const message = response.message
    const epoch = response.epoch
    return NextResponse.json({ status, message, epoch })

  } catch (error) {    
    client.close()
    const grpcError = error as ServiceError
    const errorMsg = grpcError.message || 'Unknown error occurred'
    console.error('gRPC Status error:', grpcError)

    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
