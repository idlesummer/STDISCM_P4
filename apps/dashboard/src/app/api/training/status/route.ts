import { NextRequest, NextResponse } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

export const dynamic = 'force-dynamic'

// Load the proto file
const PROTO_PATH = path.resolve(process.cwd(), '../../packages/proto/metrics.proto')

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
})

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any

export async function GET(request: NextRequest) {
  try {
    // Create gRPC client
    const client = new protoDescriptor.services.Training(
      process.env.GRPC_SERVER_URL || 'localhost:50051',
      grpc.credentials.createInsecure()
    )

    // Call Status RPC
    return new Promise<NextResponse>((resolve) => {
      client.Status({}, (error: any, response: any) => {
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
