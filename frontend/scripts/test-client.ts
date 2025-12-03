/**
 * Standalone gRPC client to test the training server
 * Run with: npm run test (from frontend directory)
 */

import * as readline from 'readline/promises'
import * as grpc from '@grpc/grpc-js'
import { promisify } from 'util'
import { TrainingClient } from '../src/generated/metrics'
import type { ServiceError } from '@grpc/grpc-js'
import type { StatusRes, StartRes, TrainingMetric } from '../src/generated/metrics'


class Client {
  private client: TrainingClient
  private statusAsync: (request: Record<string, never>) => Promise<StatusRes>
  private startAsync: (request: { numEpochs: number; confirmed: boolean }) => Promise<StartRes>

  constructor(target: string, timeout: number = 10000) {
    const channel = grpc.credentials.createInsecure()
    this.client = new TrainingClient(target, channel)

    // Promisify methods once during construction
    this.statusAsync = promisify(this.client.status.bind(this.client))
    this.startAsync = promisify(this.client.start.bind(this.client))

    // Log initialization
    console.log(`📡 Client initialized (target=${target}, timeout=${timeout / 1000}s)`)
  }

  async status(): Promise<StatusRes> {
    console.log('🔍 Checking server res...')

    try {
      const res = await this.statusAsync({})

      console.log(`   Status: ${res.status}`)
      console.log(`   Message: ${res.message}`)
      if (res.epoch > 0)
        console.log(`   Current epoch: ${res.epoch}`)
      return res

    } catch (error) {
      const grpcError = error as ServiceError
      console.error(`❌ Failed to get status: ${grpcError.code} - ${grpcError.message}`)
      throw error
    }
  }

  async start(numEpochs: number, confirmed: boolean = true): Promise<StartRes> {
    console.log(`🎬 Starting training (${numEpochs} epochs, confirmed=${confirmed})...`)

    try {
      const res = await this.startAsync({ numEpochs, confirmed })

      console.log(`   Status: ${res.status}`)
      console.log(`   Message: ${res.message}`)
      return res
      
    } catch (error) {
      const grpcError = error as ServiceError
      console.error(`❌ Failed to start training: ${grpcError.code} - ${grpcError.message}`)
      throw error
    }
  }

  subscribe(): void {
    console.log('📡 Subscribing to metrics stream...')
    const call = this.client.subscribe({})

    call.on('data', (metric: TrainingMetric) => {
      console.log('📊 Received Metric:')
      console.log(`   Epoch: ${metric.epoch}`)
      console.log(`   Batch: ${metric.batch}`)
      console.log(`   Batch Size: ${metric.batchSize}`)
      console.log(`   Batch Loss: ${metric.batchLoss.toFixed(4)}`)
      console.log(`   Predictions: [${metric.preds.slice(0, 10).join(', ')}...]`)
      console.log(`   Truths: [${metric.truths.slice(0, 10).join(', ')}...]`)
      console.log()
    })

    call.on('end', () => {
      console.log('🔌 Unsubscribed from metrics stream')
      this.close()
      process.exit(0)
    })

    call.on('error', (error: Error) => {
      console.error(`❌ Streaming error: ${error.message}`)
      this.close()
      process.exit(1)
    })
  }

  close(): void {
    console.log('🔌 Closing client channel')
    this.client.close()
  }
}

async function input(question: string): Promise<string> {
  const input = process.stdin
  const output = process.stdout
  const rl = readline.createInterface({ input, output })
  const answer = await rl.question(question)  // Use the promises API instead of callbacks
  rl.close()

  return answer.trim().toLowerCase()
}


async function main() {
  const target = 'localhost:50051'
  const numEpochs = 3
  const client = new Client(target)

  console.log(`📡 Connected to training server at ${target}.\n`)

  let shouldClose = true // Track if we should close in finally

  try {
    // Step 1: Check server status (handshake)
    const res = await client.status()

    
    if (res.status === 'ready') {

      // Step 2: Ask user for confirmation to start training
      console.log(`\n❓ Start training with ${numEpochs} epochs?`)
      const confirmation = await input('   Type "yes" to proceed: ')

      if (confirmation !== 'yes') {
        console.log('❌ Training cancelled by user.')
        return
      }

      // Step 3: Start training
      console.log()
      const startRes = await client.start(numEpochs, true)

      if (startRes.status !== 'started') {
        console.log('⚠️  Training not started. Exiting.')
        return
      }
    }
    
    if (res.status === 'training') {
      console.log(`⚠️  Server is already training at epoch ${res.epoch}. Exiting.`)
      return
    }

    else if (res.status !== 'ready') {
      console.log('⚠️  Server not ready. Exiting.')
      return
    }

    // Step 4: Subscribe to metrics stream
    console.log()
    shouldClose = false // Subscribe handlers will close the client
    client.subscribe()
  } 
  
  catch (error) {
    if (error instanceof Error)
      console.error(`❌ Error: ${error.message}`)
    else
      console.error(`❌ Error: ${String(error)}`)  
  } 

  finally {
    // Only close if we didn't reach subscribe (which handles its own cleanup)
    if (shouldClose)
      client.close()
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n⏹️  Interrupted by user')
  process.exit(0)
})


main()
