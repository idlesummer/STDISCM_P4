/**
 * Standalone gRPC client to test the training server
 * Run with: npm run test (from frontend directory)
 */

import * as readline from 'readline'
import * as grpc from '@grpc/grpc-js'
import { TrainingClient } from '../src/generated/metrics'
import type { ServiceError } from '@grpc/grpc-js'
import type { StatusRes, StartRes, TrainingMetric } from '../src/generated/metrics'

class Client {
  private client: TrainingClient
  private timeout: number

  constructor(target: string, timeout: number = 10000) {
    this.client = new TrainingClient(target, grpc.credentials.createInsecure())
    this.timeout = timeout / 1000
    console.log(`📡 Client initialized (target=${target}, timeout=${this.timeout}s)`)
  }

  async status(): Promise<StatusRes> {
    console.log('🔍 Checking server status...')

    return new Promise((resolve, reject) => {
      this.client.status({}, (error: ServiceError | null, response?: StatusRes) => {
        if (error) {
          console.error(`❌ Failed to get status: ${error.code} - ${error.message}`)
          reject(error)
          return
        }

        if (!response) {
          reject(new Error('No response received'))
          return
        }

        console.log(`   Status: ${response.status}`)
        console.log(`   Message: ${response.message}`)
        if (response.epoch > 0)
          console.log(`   Current epoch: ${response.epoch}`)

        resolve(response)
      })
    })
  }

  async start(numEpochs: number, confirmed: boolean = true): Promise<StartRes> {
    console.log(`🎬 Starting training (${numEpochs} epochs, confirmed=${confirmed})...`)

    return new Promise((resolve, reject) => {
      this.client.start({ numEpochs, confirmed }, (error: ServiceError | null, response?: StartRes) => {
        if (error) {
          console.error(`❌ Failed to start training: ${error.code} - ${error.message}`)
          reject(error)
          return
        }

        if (!response) {
          reject(new Error('No response received'))
          return
        }

        console.log(`   Status: ${response.status}`)
        console.log(`   Message: ${response.message}`)
        resolve(response)
      })
    })
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

async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

async function main(): Promise<void> {
  const target = 'localhost:50051'
  const numEpochs = 3
  const client = new Client(target)

  console.log(`📡 Connected to training server at ${target}.\n`)

  let shouldClose = true // Track if we should close in finally

  try {
    // Step 1: Check server status (handshake)
    const status = await client.status()

    if (status.status === 'training') {
      console.log(`⚠️  Server is already training at epoch ${status.epoch}. Exiting.`)
      return
    }

    if (status.status !== 'ready') {
      console.log('⚠️  Server not ready. Exiting.')
      return
    }

    // Step 2: Ask user for confirmation
    console.log(`\n❓ Start training with ${numEpochs} epochs?`)
    const confirmation = await askQuestion('   Type "yes" to proceed: ')

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

    // Step 4: Subscribe to metrics stream
    console.log()
    shouldClose = false // Subscribe handlers will close the client
    client.subscribe()

  } catch (error) {
    if (error instanceof Error)
      console.error(`❌ Error: ${error.message}`)
    else
      console.error(`❌ Error: ${String(error)}`)
  } finally {
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
