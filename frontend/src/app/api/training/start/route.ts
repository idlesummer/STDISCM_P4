import { NextRequest, NextResponse } from 'next/server'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

export const dynamic = 'force-dynamic'

// Load the proto file
const PROTO_PATH = path.resolve(process.cwd(), '../packages/proto/metrics.proto')

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
})

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const numEpochs = body.numEpochs || 3

    // Create gRPC client
    const client = new protoDescriptor.services.Training(
      process.env.GRPC_SERVER_URL || 'localhost:50051',
      grpc.credentials.createInsecure()
    )

    // Call Start RPC
    return new Promise<NextResponse>((resolve) => {
      client.Start(
        { num_epochs: numEpochs, confirmed: true },
        (error: any, response: any) => {
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
